/**
 * vvosp-api —— 「欧阳威 · AI 助手」的后端。
 *
 * 路由：
 *   GET  /api/health  健康检查（前端状态灯用）
 *   POST /api/chat    对话，默认 SSE 流式；body.stream === false 时返回 JSON
 *
 * 设计取舍：
 * - 无状态：多轮上下文由前端把最近几轮 history 一起传上来，服务端不留会话，
 *   省掉 KV / Durable Object，也不会有“会话串味”的问题。
 * - 提示词固定前缀，DeepSeek 的上下文缓存能命中，长提示词几乎不花钱。
 * - 关闭 thinking 模式：简历问答用不上推理链，关掉后首字快、token 少。
 */

import { buildSystemPrompt, FALLBACK_REPLY } from './prompt.js';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_MODEL = 'deepseek-flash';

const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_TURNS = 8;
const MAX_HISTORY_CHARS = 2000;
const UPSTREAM_TIMEOUT_MS = 60000;

/* ------------------------------ 工具函数 ------------------------------ */

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors.headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function resolveCors(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowList = (env.ALLOWED_ORIGINS || 'https://vvosp.top,https://www.vvosp.top')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  // 没有 Origin 的请求（curl、服务端调用）放行；有 Origin 就必须在白名单里
  if (!origin || allowList.includes(origin)) {
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    return { ok: true, headers };
  }
  return { ok: false, headers };
}

function sanitizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const turns = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_HISTORY_CHARS) }))
    .slice(-MAX_HISTORY_TURNS * 2);
  return turns;
}

/** 把上游的失败翻成访客看得懂的话 */
function friendlyUpstreamError(status) {
  if (status === 401 || status === 403) return '后端密钥失效了，暂时没法回答。可以直接发邮件给欧阳威：me@vvosp.top';
  if (status === 402) return '额度用完了，助手暂时下线。可以先发邮件：me@vvosp.top';
  if (status === 429) return '问得有点快，歇一分钟再问我吧。';
  if (status >= 500) return '模型服务刚才抖了一下，稍后再试一次。';
  return '刚才没能连上模型服务，稍后再试试。';
}

/* ------------------------------ 健康检查 ------------------------------ */

function handleHealth(env, cors) {
  return json({ ok: true, model: env.MODEL || DEFAULT_MODEL, ts: Date.now() }, 200, cors);
}

/* -------------------------------- 对话 -------------------------------- */

async function checkRateLimit(request, env) {
  if (!env.CHAT_RATE) return { allowed: true };
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  try {
    const { success } = await env.CHAT_RATE.limit({ key: ip });
    return { allowed: success, ip };
  } catch {
    // 限流器异常不该挡正常访客
    return { allowed: true, ip };
  }
}

function sseHeaders(cors) {
  return {
    ...cors.headers,
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store, no-transform',
    'X-Accel-Buffering': 'no',
  };
}

/** 本地没有 key 时的演示流，用来验证前端解析与渲染 */
function mockStream(cors) {
  const text = '（本地测试模式）我是欧阳威的 AI 助手，现在跑在 Cloudflare Worker 里，流式输出正常。';
  const chunks = Array.from(text);
  const enc = new TextEncoder();
  let i = 0;
  const body = new ReadableStream({
    pull(controller) {
      if (i >= chunks.length) {
        controller.enqueue(enc.encode('data: [DONE]\n\n'));
        controller.close();
        return;
      }
      const payload = { choices: [{ delta: { content: chunks[i++] } }] };
      controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
    },
  });
  return new Response(body, { headers: sseHeaders(cors) });
}

async function handleChat(request, env, cors) {
  if (!cors.ok) return json({ error: 'forbidden_origin', message: '来源不被允许' }, 403, cors);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json', message: '请求格式不对' }, 400, cors);
  }

  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message) return json({ error: 'empty_message', message: '消息不能为空' }, 400, cors);
  if (message.length > MAX_MESSAGE_CHARS) {
    return json({ error: 'too_long', message: `一次最多 ${MAX_MESSAGE_CHARS} 个字，长问题可以拆开问。` }, 413, cors);
  }

  const rate = await checkRateLimit(request, env);
  if (!rate.allowed) {
    return json({ error: 'rate_limited', message: '问得有点快，歇一分钟再问我吧。' }, 429, cors);
  }

  if (env.MOCK === '1') return mockStream(cors);
  if (!env.DEEPSEEK_API_KEY) {
    return json({ error: 'no_key', message: '后端还没配置密钥（wrangler secret put DEEPSEEK_API_KEY）' }, 500, cors);
  }

  const wantStream = body.stream !== false;
  // 提示词里要写“今天”，按东八区算，避免 UTC 跨天时差一天
  const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  const messages = [
    { role: 'system', content: buildSystemPrompt(today) },
    ...sanitizeHistory(body.history),
    { role: 'user', content: message },
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let upstream;
  try {
    upstream = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.MODEL || DEFAULT_MODEL,
        messages,
        stream: wantStream,
        // 简历问答不需要推理链：关掉 thinking，首字更快、token 更少
        thinking: { type: 'disabled' },
        temperature: 0.6,
        max_tokens: 512,
      }),
    });
  } catch {
    clearTimeout(timer);
    return json({ error: 'upstream_unreachable', message: '刚才没能连上模型服务，稍后再试试。' }, 502, cors);
  }
  clearTimeout(timer);

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '');
    console.error('deepseek error', upstream.status, detail.slice(0, 500));
    return json(
      { error: 'upstream_error', status: upstream.status, message: friendlyUpstreamError(upstream.status) },
      502,
      cors,
    );
  }

  if (wantStream) {
    // 直接把上游 SSE 透传给浏览器，前端按 OpenAI 的 chunk 格式解析
    return new Response(upstream.body, { headers: sseHeaders(cors) });
  }

  try {
    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || FALLBACK_REPLY;
    return json({ reply }, 200, cors);
  } catch {
    return json({ error: 'bad_upstream_json', message: FALLBACK_REPLY }, 502, cors);
  }
}

/* -------------------------------- 入口 -------------------------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = resolveCors(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: cors.ok ? 204 : 403, headers: cors.headers });
    }

    if (url.pathname === '/api/health') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return json({ error: 'method_not_allowed' }, 405, cors);
      }
      return handleHealth(env, cors);
    }

    if (url.pathname === '/api/chat') {
      if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);
      return handleChat(request, env, cors);
    }

    return json({ error: 'not_found', message: '接口不存在' }, 404, cors);
  },
};
