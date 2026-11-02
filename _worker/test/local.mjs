/**
 * 不装 wrangler 也能测：直接用 Node 的 fetch / Request / Response 跑 Worker 入口。
 * 用法：cd _worker && node test/local.mjs
 */
import worker from '../src/index.js';

let pass = 0;
let fail = 0;

function check(name, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${extra ? ' → ' + extra : ''}`);
  }
}

const ORIGIN_OK = 'https://vvosp.top';
const ORIGIN_BAD = 'https://evil.example';

function req(path, init = {}) {
  return new Request(`https://api.vvosp.top${path}`, init);
}

function postChat(body, headers = { Origin: ORIGIN_OK }) {
  return req('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function readSSE(response) {
  const text = await response.text();
  const chunks = [];
  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const payload = line.slice(6).trim();
    if (payload === '[DONE]') continue;
    try {
      const c = JSON.parse(payload)?.choices?.[0]?.delta?.content;
      if (c) chunks.push(c);
    } catch { /* ignore */ }
  }
  return { text, chunks: chunks.join('') };
}

function sseResponse(chunks) {
  const enc = new TextEncoder();
  let i = 0;
  const body = new ReadableStream({
    pull(controller) {
      if (i >= chunks.length) {
        controller.enqueue(enc.encode('data: [DONE]\n\n'));
        controller.close();
        return;
      }
      controller.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunks[i++] } }] })}\n\n`));
    },
  });
  return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
}

/* ------------------------------------------------------------------ */
console.log('\n[1] 健康检查与路由');
{
  const res = await worker.fetch(req('/api/health'), {});
  const data = await res.json();
  check('GET /api/health → 200', res.status === 200);
  check('返回 ok:true 和模型名', data.ok === true && data.model === 'deepseek-flash', JSON.stringify(data));

  const res404 = await worker.fetch(req('/nope'), {});
  check('未知路径 → 404', res404.status === 404);

  const res405 = await worker.fetch(req('/api/chat'), {});
  check('GET /api/chat → 405', res405.status === 405);
}

console.log('\n[2] CORS');
{
  const pre = await worker.fetch(req('/api/chat', { method: 'OPTIONS', headers: { Origin: ORIGIN_OK } }), {});
  check('白名单来源的预检 → 204', pre.status === 204);
  check('回写 Access-Control-Allow-Origin', pre.headers.get('access-control-allow-origin') === ORIGIN_OK);

  const preBad = await worker.fetch(req('/api/chat', { method: 'OPTIONS', headers: { Origin: ORIGIN_BAD } }), {});
  check('陌生来源的预检 → 403', preBad.status === 403);

  const bad = await worker.fetch(postChat({ message: '你好' }, { Origin: ORIGIN_BAD }), {});
  check('陌生来源的实际请求 → 403', bad.status === 403);
}

console.log('\n[3] 入参校验');
{
  const bad = await worker.fetch(
    req('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'not json' }),
    {},
  );
  check('非法 JSON → 400', bad.status === 400);

  const empty = await worker.fetch(postChat({ message: '   ' }), {});
  check('空消息 → 400', empty.status === 400);

  const long = await worker.fetch(postChat({ message: '字'.repeat(1001) }), {});
  check('超长消息 → 413', long.status === 413);
}

console.log('\n[4] 模拟模式（MOCK=1）');
{
  const res = await worker.fetch(postChat({ message: '你擅长什么？' }), { MOCK: '1' });
  check('Content-Type 是 SSE', (res.headers.get('content-type') || '').includes('text/event-stream'));
  const { text, chunks } = await readSSE(res);
  check('包含 data: 帧与 [DONE] 结束标记', text.includes('data: ') && text.includes('[DONE]'));
  check('能拼出完整回复', chunks.length > 5, chunks.slice(0, 30));
}

console.log('\n[5] 转发真实上游');
{
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const payload = JSON.parse(init.body);
    check('  · 关闭了 thinking 模式', payload.thinking?.type === 'disabled', JSON.stringify(payload.thinking));
    check('  · 第一条是 system 提示词', payload.messages[0].role === 'system' && payload.messages[0].content.includes('欧阳威'));
    check('  · 模型是 deepseek-flash', payload.model === 'deepseek-flash');
    check('  · 带了 Authorization', init.headers.Authorization === 'Bearer test-key');
    check('  · 历史被带上', payload.messages.length === 4, `len=${payload.messages.length}`);
    return sseResponse(['你好', '，我是', '助手。']);
  };

  const env = { DEEPSEEK_API_KEY: 'test-key' };
  const res = await worker.fetch(
    postChat({ message: '介绍一下你自己', history: [{ role: 'user', content: '在吗' }, { role: 'assistant', content: '在的' }] }),
    env,
  );
  const { chunks, text } = await readSSE(res);
  check('流式透传拼回完整文本', chunks === '你好，我是助手。', chunks);
  check('没把上游帧改坏', text.trim().endsWith('[DONE]'));

  globalThis.fetch = async (url, init) => {
    const payload = JSON.parse(init.body);
    check('  · stream:false 时上游不流式', payload.stream === false);
    return new Response(JSON.stringify({ choices: [{ message: { content: '  非流式回答  ' } }] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const jsonRes = await worker.fetch(postChat({ message: '你好', stream: false }), env);
  const jsonBody = await jsonRes.json();
  check('非流式返回 {reply}', jsonBody.reply === '非流式回答', JSON.stringify(jsonBody));

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: 'quota' }), { status: 402, headers: { 'Content-Type': 'application/json' } });
  const failRes = await worker.fetch(postChat({ message: '你好' }), env);
  const failBody = await failRes.json();
  check('上游 402 → 502', failRes.status === 502);
  check('给出人话提示', failBody.message.includes('额度'), failBody.message);

  globalThis.fetch = async () => {
    throw new Error('network down');
  };
  const downRes = await worker.fetch(postChat({ message: '你好' }), env);
  check('网络异常 → 502', downRes.status === 502);

  globalThis.fetch = realFetch;
}

console.log('\n[6] 限流与缺密钥');
{
  const denied = await worker.fetch(postChat({ message: '你好' }), {
    DEEPSEEK_API_KEY: 'k',
    CHAT_RATE: { limit: async () => ({ success: false }) },
  });
  check('限流器拒绝 → 429', denied.status === 429);

  const realFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: '被放行了' } }] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  const allowed = await worker.fetch(postChat({ message: '你好', stream: false }), {
    DEEPSEEK_API_KEY: 'k',
    CHAT_RATE: { limit: async () => ({ success: true }) },
  });
  check('限流器放行时不误伤', allowed.status === 200, String(allowed.status));
  globalThis.fetch = realFetch;

  const noKey = await worker.fetch(postChat({ message: '你好' }), {});
  const noKeyBody = await noKey.json();
  check('缺密钥 → 500 且提示配 secret', noKey.status === 500 && noKeyBody.message.includes('secret'));
}

console.log(`\n结果：${pass} 通过，${fail} 失败\n`);
process.exit(fail === 0 ? 0 : 1);
