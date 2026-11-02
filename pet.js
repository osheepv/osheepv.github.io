/**
 * 站点宠物「大肥鱼」—— dsh-pet 的网页移植精简版
 *
 * 移植自 dsh-pet（MIT, PC2005-cloud），去掉桌面壁纸、系统通知、余额展示等
 * 依赖 Electron / DSH 宿主的能力，保留纯前端可复刻的部分：
 *   无缝动画链 / 点击回应 / 拖拽抛掷与落地 / 位置记忆 / 碎碎念 / 右键菜单
 *
 * 素材为 VP9-alpha webm（Chrome / Edge / Firefox 支持透明），
 * Safari 不支持，直接不显示，不降级成黑底方块。
 */
(function () {
  'use strict';

  /* ---------- 环境判定：窄屏、Safari、减少动效 ---------- */
  if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return;

  var probe = document.createElement('video');
  var canWebm = !!(probe.canPlayType && probe.canPlayType('video/webm; codecs="vp9"'));
  if (!canWebm) return;

  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var BASE = '/assets/pet/';
  var CLIPS = {
    idle: 'idle.webm',
    doze: 'doze.webm',
    think: 'think.webm',
    wave: 'wave.webm',
    shy: 'shy.webm',
    drag: 'drag.webm',
    land: 'land.webm',
    mumble: 'mumble.webm'
  };

  var MARGIN = 24;
  var SIZE_MIN = 120;
  var SIZE_MAX = 172;

  /* 碎碎念台词（本地池，零成本；要接模型见 README） */
  var LINES = [
    '今天也在努力地……吃白饭。',
    '记得把简历看完哦，别只看我的尾巴。',
    '数学建模 72 小时，我只负责在旁边睡。',
    '拖我一下试试？会飞的。',
    'Deep Thesis 那 448 项测试，全绿了喵。',
    '这里是 vvosp.top，没有人比我更熟悉这个站。',
    '他最近在折腾 Cloudflare，电脑终于能关了。',
    '别光看我，往下滑，项目经历在下面。',
    '鲸鱼尾巴了解一下，很软的。',
    '如果你有合作想法，他邮箱在页脚。',
    '我在这个角落待机，顺便帮你看着页面。',
    '再点我一下，我给你表演个 Q 弹。'
  ];

  /* ---------- 建 DOM ---------- */
  var root = document.createElement('div');
  root.className = 'site-pet';
  root.setAttribute('aria-hidden', 'true');

  var stage = document.createElement('div');
  stage.className = 'pet-stage';

  var vidA = document.createElement('video');
  var vidB = document.createElement('video');
  [vidA, vidB].forEach(function (v) {
    v.className = 'pet-video';
    v.muted = true;
    v.playsInline = true;
    v.autoplay = true;
    v.preload = 'auto';
    v.disablePictureInPicture = true;
    stage.appendChild(v);
  });

  var bubble = document.createElement('div');
  bubble.className = 'pet-bubble';
  root.appendChild(stage);
  root.appendChild(bubble);

  var menu = document.createElement('div');
  menu.className = 'pet-menu';
  menu.hidden = true;
  // 菜单挂到 body：.site-pet 上有 filter，fixed 子元素会以它为包含块，位置会算错
  document.body.appendChild(menu);

  /* ---------- 状态 ---------- */
  var pos = { left: MARGIN, bottom: MARGIN };   // 落定位置（px）
  var drag = { on: false, moved: false, startX: 0, startY: 0, offX: 0, offY: 0, trail: [] };
  var fly = { on: false, raf: 0, x: 0, y: 0, vx: 0, vy: 0 };
  var active = 0;
  var current = '';
  var mode = 'idle';
  var idleTimer = 0;
  var actTimer = 0;
  var whisperTimer = 0;
  var bubbleTimer = 0;

  var vids = [vidA, vidB];

  /* ---------- 位置 ---------- */
  function storeKey() { return 'ow-pet-pos'; }

  function loadPos() {
    try {
      var raw = localStorage.getItem(storeKey());
      if (!raw) return;
      var p = JSON.parse(raw);
      if (typeof p.left === 'number' && typeof p.bottom === 'number') {
        pos.left = p.left;
        pos.bottom = p.bottom;
      }
    } catch (e) { /* 忽略 */ }
  }

  function savePos() {
    try {
      localStorage.setItem(storeKey(), JSON.stringify({
        left: Math.round(pos.left),
        bottom: Math.round(pos.bottom)
      }));
    } catch (e) { /* 忽略 */ }
  }

  function clampPos() {
    var w = root.offsetWidth || SIZE_MAX;
    var maxLeft = window.innerWidth - w - MARGIN;
    var maxBottom = window.innerHeight - (root.offsetHeight || SIZE_MAX) - MARGIN;
    pos.left = Math.max(MARGIN, Math.min(pos.left, Math.max(MARGIN, maxLeft)));
    pos.bottom = Math.max(MARGIN, Math.min(pos.bottom, Math.max(MARGIN, maxBottom)));
  }

  function applyPos() {
    root.style.left = pos.left + 'px';
    root.style.bottom = pos.bottom + 'px';
    root.style.transform = 'translate3d(0,0,0)';
  }

  /* ---------- 动画 ---------- */
  function setClip(name, loop) {
    if (current === name) {
      var cur = vids[active];
      if (cur && cur.paused) { cur.play().catch(function () {}); }
      return;
    }
    var next = vids[1 - active];
    var prev = vids[active];

    if (next.getAttribute('data-clip') !== name) {
      next.setAttribute('data-clip', name);
      next.src = BASE + CLIPS[name];
    }
    next.loop = !!loop;
    try { next.currentTime = 0; } catch (e) { /* 未就绪 */ }
    next.play().catch(function () {});
    next.classList.add('on');
    if (prev) prev.classList.remove('on');
    active = 1 - active;
    current = name;
  }

  function scheduleIdleChain() {
    window.clearTimeout(idleTimer);
    if (REDUCED) return;
    var wait = 14000 + Math.random() * 12000;
    idleTimer = window.setTimeout(function () {
      if (mode !== 'idle' || drag.on || fly.on) { scheduleIdleChain(); return; }
      var pick = Math.random();
      if (pick < 0.45) { mode = 'act'; playOnce('doze'); }
      else if (pick < 0.75) { mode = 'act'; playOnce('think'); }
      else { scheduleIdleChain(); }
    }, wait);
  }

  /* 素材统一 10 秒长，播完再切回待机会拖太久，所以按剪辑自己定时 */
  var CLIP_MS = { wave: 2600, shy: 2600, land: 900, doze: 6000, think: 6000, mumble: 3200 };

  function playOnce(name) {
    setClip(name, false);
    window.clearTimeout(actTimer);
    actTimer = window.setTimeout(function () {
      if (mode === 'act') returnToIdle();
    }, CLIP_MS[name] || 2600);
  }

  function returnToIdle() {
    mode = 'idle';
    setClip('idle', true);
    scheduleIdleChain();
  }

  /* ---------- Q 弹 ---------- */
  function squish(power) {
    if (REDUCED) return;
    stage.classList.remove('squish');
    void stage.offsetWidth;
    stage.style.setProperty('--squish', String(power || 0.55));
    stage.classList.add('squish');
  }

  /* ---------- 点击回应 ---------- */
  function react() {
    mode = 'act';
    var pick = Math.random() < 0.6 ? 'wave' : 'shy';
    squish(0.55);
    playOnce(pick);
  }

  /* ---------- 碎碎念 ---------- */
  function say(text, ms) {
    bubble.textContent = text;
    bubble.classList.add('on');
    window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(function () {
      bubble.classList.remove('on');
    }, ms || 6000);
  }

  function scheduleWhisper() {
    window.clearTimeout(whisperTimer);
    var wait = 75000 + Math.random() * 60000;
    whisperTimer = window.setTimeout(function () {
      if (document.hidden || drag.on || fly.on) { scheduleWhisper(); return; }
      if (mode !== 'idle') { scheduleWhisper(); return; }
      playOnce('mumble');
      say(LINES[Math.floor(Math.random() * LINES.length)], 7000);
      scheduleWhisper();
    }, wait);
  }

  /* ---------- 拖拽与抛掷 ---------- */
  function pointerPos(e) {
    return { x: e.clientX, y: e.clientY };
  }

  function onDown(e) {
    if (e.button !== 0) return;
    hideMenu();
    var p = pointerPos(e);
    drag.on = true;
    drag.moved = false;
    drag.startX = p.x;
    drag.startY = p.y;
    drag.offX = 0;
    drag.offY = 0;
    drag.trail = [{ x: p.x, y: p.y, t: performance.now() }];
    root.classList.add('dragging');
    window.clearTimeout(idleTimer);
    if (fly.on) stopFly();
    mode = 'drag';
    setClip('drag', true);
    root.setPointerCapture && root.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onMove(e) {
    if (!drag.on) return;
    var p = pointerPos(e);
    var dx = p.x - drag.startX;
    var dy = p.y - drag.startY;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
    if (!drag.moved) return;

    // 过阻尼弹簧跟手：留一点滞后，手感不飘
    drag.offX += (dx - drag.offX) * 0.45;
    drag.offY += (dy - drag.offY) * 0.45;
    root.style.transform = 'translate3d(' + drag.offX.toFixed(1) + 'px,' + drag.offY.toFixed(1) + 'px,0)';

    drag.trail.push({ x: p.x, y: p.y, t: performance.now() });
    if (drag.trail.length > 12) drag.trail.shift();
    e.preventDefault();
  }

  function onUp() {
    if (!drag.on) return;
    drag.on = false;
    root.classList.remove('dragging');

    if (!drag.moved) {            // 只是点了一下
      applyPos();
      react();
      return;
    }

    // 用最后一段轨迹估速
    var now = performance.now();
    var first = drag.trail[0] || { x: drag.startX, y: drag.startY, t: now - 16 };
    var last = drag.trail[drag.trail.length - 1] || { x: drag.startX, y: drag.startY, t: now };
    var dt = Math.max(16, now - first.t) / 1000;
    var vx = (last.x - first.x) / dt;
    var vy = (last.y - first.y) / dt;

    // 落到新位置：把位移折成 left/bottom
    pos.left += drag.offX;
    pos.bottom -= drag.offY;
    clampPos();
    root.style.transform = 'translate3d(0,0,0)';

    var speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 260 || REDUCED) {   // 温柔放下
      applyPos();
      savePos();
      returnToIdle();
      squish(0.8);
      return;
    }

    startFly(vx * 0.55, vy * 0.55);
  }

  function startFly(vx, vy) {
    fly.on = true;
    fly.vx = vx;
    fly.vy = vy;
    fly.x = 0;
    fly.y = 0;
    mode = 'fly';
    setClip('drag', true);
    var lastT = performance.now();

    function step(now) {
      var dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      fly.vy += 1400 * dt;
      fly.x += fly.vx * dt;
      fly.y += fly.vy * dt;

      var w = root.offsetWidth || SIZE_MAX;
      var h = root.offsetHeight || SIZE_MAX;
      var minX = MARGIN - pos.left;
      var maxX = window.innerWidth - w - MARGIN - pos.left;
      var minY = MARGIN - pos.bottom;
      var maxY = window.innerHeight - h - MARGIN - pos.bottom;

      if (fly.x < minX) { fly.x = minX; fly.vx = Math.abs(fly.vx) * 0.78; }
      if (fly.x > maxX) { fly.x = maxX; fly.vx = -Math.abs(fly.vx) * 0.78; }
      if (fly.y < minY) { fly.y = minY; fly.vy = Math.abs(fly.vy) * 0.78; }
      if (fly.y > maxY) {
        fly.y = maxY;
        fly.vy = -Math.abs(fly.vy) * 0.55;
        fly.vx *= 0.86;
        if (Math.abs(fly.vy) < 160) return land();
      }

      root.style.transform = 'translate3d(' + fly.x.toFixed(1) + 'px,' + fly.y.toFixed(1) + 'px,0)';
      fly.raf = requestAnimationFrame(step);
    }
    fly.raf = requestAnimationFrame(step);
  }

  function stopFly() {
    fly.on = false;
    cancelAnimationFrame(fly.raf);
  }

  function land() {
    stopFly();
    pos.left += fly.x;
    pos.bottom -= fly.y;
    clampPos();
    applyPos();
    savePos();
    mode = 'act';
    setClip('land', false);
    squish(0.62);
    window.setTimeout(function () {
      if (mode === 'act') returnToIdle();
    }, 700);
  }

  /* ---------- 右键菜单 ---------- */
  function buildMenu() {
    [
      ['回到初始位置', function () {
        pos.left = MARGIN;
        pos.bottom = MARGIN;
        applyPos();
        savePos();
      }],
      ['换个动作', function () {
        mode = 'act';
        playOnce(Math.random() < 0.5 ? 'doze' : 'think');
      }],
      ['说句话', function () {
        say(LINES[Math.floor(Math.random() * LINES.length)], 6000);
      }]
    ].forEach(function (item) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = item[0];
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        hideMenu();
        item[1]();
      });
      menu.appendChild(b);
    });
  }

  function showMenu(x, y) {
    menu.hidden = false;
    var r = menu.getBoundingClientRect();
    var left = Math.min(x, window.innerWidth - r.width - 12);
    var top = Math.min(y, window.innerHeight - r.height - 12);
    menu.style.left = Math.max(12, left) + 'px';
    menu.style.top = Math.max(12, top) + 'px';
  }

  function hideMenu() { menu.hidden = true; }

  /* ---------- 启动 ---------- */
  function init() {
    document.body.appendChild(root);
    loadPos();
    clampPos();
    applyPos();
    buildMenu();
    setClip('idle', true);
    scheduleIdleChain();
    scheduleWhisper();

    root.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    root.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      showMenu(e.clientX, e.clientY);
    });
    document.addEventListener('click', hideMenu);
    window.addEventListener('resize', function () {
      clampPos();
      applyPos();
    });

    // 空闲时把常用动作预取，点击时才不卡
    window.setTimeout(function () {
      vids.forEach(function (v) { if (!v.getAttribute('data-clip')) v.setAttribute('data-clip', ''); });
      ['wave', 'shy', 'mumble'].forEach(function (name) {
        var link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'video';
        link.href = BASE + CLIPS[name];
        document.head.appendChild(link);
      });
    }, 4000);

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
