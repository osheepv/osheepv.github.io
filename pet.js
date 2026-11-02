/**
 * 站点宠物「大肥鱼」—— dsh-pet 的网页移植精简版
 *
 * 移植自 dsh-pet（MIT, PC2005-cloud）。保留纯前端可复刻的部分：
 *   无缝动画链 / 点击回应 / 拖拽抛掷 / 区域碰撞 / 位置记忆 / 碎碎念 / 右键菜单
 *
 * 坐标体系：宠物用视口坐标 (x, y) 表示左上角，固定定位后用 transform 移动。
 * 约束区域（region）有两种：
 *   - 视口：默认，四周留 MARGIN
 *   - 聊天卡片：AI 助手页的 .chat-window，拖进去之后物理边界就是这张卡片，
 *     抛掷只会在卡片里反弹，想出来必须按住鼠标拖出去
 *
 * 素材为 VP9-alpha webm，Safari 不支持透明，直接不显示。
 */
(function () {
  'use strict';

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
  /* 素材统一 10 秒长，播完再切回待机会拖太久，按剪辑各自定时 */
  var CLIP_MS = { wave: 2600, shy: 2600, land: 900, doze: 6000, think: 6000, mumble: 3200 };

  var MARGIN = 24;          // 视口四周留白
  var INSET = 8;            // 卡片内留白
  var GRAVITY = 1400;
  var RESTITUTION = 0.78;
  var FLOOR_BOUNCE = 0.55;
  var FLOOR_FRICTION = 0.86;
  var STOP_VY = 150;
  var DRAG_THRESHOLD = 6;

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
  // 菜单挂到 body：.site-pet 上有 filter，fixed 子元素会以它为包含块
  document.body.appendChild(menu);

  /* ---------- 状态 ---------- */
  var pos = { x: MARGIN, y: 0 };          // 宠物左上角（视口坐标）
  var region = null;                      // 当前约束区
  var regionIsCard = false;
  var drag = null;
  var flying = null;
  var active = 0;
  var current = '';
  var mode = 'idle';
  var idleTimer = 0;
  var actTimer = 0;
  var whisperTimer = 0;
  var bubbleTimer = 0;
  var raf = 0;

  var vids = [vidA, vidB];

  function elW() { return root.offsetWidth || 220; }
  function elH() { return root.offsetHeight || 124; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(v, hi)); }

  /* ---------- 区域 ---------- */
  function viewportRegion() {
    return {
      left: MARGIN,
      top: MARGIN,
      right: window.innerWidth - MARGIN,
      bottom: window.innerHeight - MARGIN,
      card: false
    };
  }

  function cardRegion() {
    var el = document.querySelector('.chat-window');
    if (!el) return null;
    var r = el.getBoundingClientRect();
    if (r.width < 160 || r.height < 160) return null;
    if (r.bottom < 0 || r.top > window.innerHeight) return null;
    return {
      left: Math.max(0, r.left + INSET),
      top: Math.max(0, r.top + INSET),
      right: Math.min(window.innerWidth, r.right - INSET),
      bottom: Math.min(window.innerHeight, r.bottom - INSET),
      card: true
    };
  }

  /** 按宠物中心点决定它该待在哪个约束区 */
  function pickRegion(cx, cy) {
    var card = cardRegion();
    if (card && cx > card.left && cx < card.right && cy > card.top && cy < card.bottom) return card;
    return viewportRegion();
  }

  function setRegion(r) {
    region = r;
    regionIsCard = !!(r && r.card);
    root.classList.toggle('in-card', regionIsCard);
  }

  function clampToRegion(r) {
    var w = elW(), h = elH();
    pos.x = clamp(pos.x, r.left, Math.max(r.left, r.right - w));
    pos.y = clamp(pos.y, r.top, Math.max(r.top, r.bottom - h));
  }

  /* ---------- 渲染与存储 ---------- */
  function render() {
    root.style.transform = 'translate3d(' + Math.round(pos.x) + 'px,' + Math.round(pos.y) + 'px,0)';
  }

  function storeKey() { return 'ow-pet-pos'; }

  function savePos() {
    try {
      localStorage.setItem(storeKey(), JSON.stringify({ x: Math.round(pos.x), y: Math.round(pos.y) }));
    } catch (e) { /* 忽略 */ }
  }

  function loadPos() {
    var raw = null;
    try { raw = localStorage.getItem(storeKey()); } catch (e) { return; }
    if (!raw) return;
    try {
      var p = JSON.parse(raw);
      if (typeof p.x === 'number' && typeof p.y === 'number') {
        pos.x = p.x;
        pos.y = p.y;
      }
    } catch (e) { /* 忽略 */ }
  }

  function parkInitial() {
    pos.x = MARGIN;
    pos.y = window.innerHeight - elH() - MARGIN;
    render();
    savePos();
  }

  /* ---------- 动画 ---------- */
  function setClip(name, loop) {
    if (current === name) {
      var cur = vids[active];
      if (cur && cur.paused) cur.play().catch(function () {});
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
    idleTimer = window.setTimeout(function () {
      if (mode !== 'idle' || drag || flying) { scheduleIdleChain(); return; }
      var pick = Math.random();
      if (pick < 0.45) playOnce('doze');
      else if (pick < 0.75) playOnce('think');
      else scheduleIdleChain();
    }, 14000 + Math.random() * 12000);
  }

  function playOnce(name) {
    mode = 'act';
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

  function squish(power) {
    if (REDUCED) return;
    stage.classList.remove('squish');
    void stage.offsetWidth;
    stage.style.setProperty('--squish', String(power || 0.55));
    stage.classList.add('squish');
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
    whisperTimer = window.setTimeout(function () {
      if (document.hidden || drag || flying || mode !== 'idle') { scheduleWhisper(); return; }
      playOnce('mumble');
      say(LINES[Math.floor(Math.random() * LINES.length)], 7000);
      scheduleWhisper();
    }, 75000 + Math.random() * 60000);
  }

  /* ---------- 拖拽 ---------- */
  function pointer(e) { return { x: e.clientX, y: e.clientY }; }

  function onDown(e) {
    if (e.button !== 0) return;
    hideMenu();
    var p = pointer(e);
    drag = {
      startX: p.x,
      startY: p.y,
      baseX: pos.x,
      baseY: pos.y,
      moved: false,
      trail: [{ x: p.x, y: p.y, t: performance.now() }]
    };
    window.clearTimeout(idleTimer);
    window.clearTimeout(actTimer);
    if (flying) stopFly();
    mode = 'drag';
    setClip('drag', true);
    root.classList.add('dragging');
    if (root.setPointerCapture) { try { root.setPointerCapture(e.pointerId); } catch (err) {} }
    e.preventDefault();
  }

  function onMove(e) {
    if (!drag) return;
    var p = pointer(e);
    var dx = p.x - drag.startX;
    var dy = p.y - drag.startY;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) drag.moved = true;
    if (!drag.moved) return;

    // 拖拽阶段只受视口限制：拖进/拖出聊天卡片都靠这一步
    var w = elW(), h = elH();
    pos.x = clamp(drag.baseX + dx, 0, window.innerWidth - w);
    pos.y = clamp(drag.baseY + dy, 0, window.innerHeight - h);
    render();

    drag.trail.push({ x: p.x, y: p.y, t: performance.now() });
    if (drag.trail.length > 12) drag.trail.shift();
    e.preventDefault();
  }

  function onUp() {
    if (!drag) return;
    var moved = drag.moved;
    var startX = drag.startX, startY = drag.startY, trail = drag.trail;
    drag = null;
    root.classList.remove('dragging');

    if (!moved) { react(); return; }

    var now = performance.now();
    var first = trail[0] || { x: startX, y: startY, t: now - 16 };
    var last = trail[trail.length - 1] || { x: startX, y: startY, t: now };
    var dt = Math.max(16, now - first.t) / 1000;
    var vx = (last.x - first.x) / dt;
    var vy = (last.y - first.y) / dt;
    var speed = Math.sqrt(vx * vx + vy * vy);

    var cx = pos.x + elW() / 2;
    var cy = pos.y + elH() / 2;
    var r = pickRegion(cx, cy);
    setRegion(r);
    clampToRegion(r);

    if (speed < 260 || REDUCED) {
      // 温柔放下也要落地：宠物永远贴着它所在区域的地面，不悬在半空
      if (REDUCED) {
        pos.y = Math.max(r.top, r.bottom - elH());
        render();
        savePos();
        squish(0.8);
        returnToIdle();
        return;
      }
      startFly(vx * 0.18, vy * 0.18, r);
      return;
    }

    startFly(vx * 0.55, vy * 0.55, r);
  }

  /* ---------- 抛掷物理 ---------- */
  function startFly(vx, vy, r) {
    flying = { vx: vx, vy: vy, region: r };
    mode = 'fly';
    setClip('drag', true);
    var lastT = performance.now();

    function step(now) {
      if (!flying) return;
      var dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      var reg = flying.region;
      var w = elW(), h = elH();

      flying.vy += GRAVITY * dt;
      pos.x += flying.vx * dt;
      pos.y += flying.vy * dt;

      if (pos.x <= reg.left) {
        pos.x = reg.left;
        flying.vx = Math.abs(flying.vx) * RESTITUTION;
      } else if (pos.x >= reg.right - w) {
        pos.x = reg.right - w;
        flying.vx = -Math.abs(flying.vx) * RESTITUTION;
      }

      if (pos.y <= reg.top) {
        pos.y = reg.top;
        flying.vy = Math.abs(flying.vy) * RESTITUTION;
      }

      if (pos.y >= reg.bottom - h) {
        pos.y = reg.bottom - h;
        flying.vy = -Math.abs(flying.vy) * FLOOR_BOUNCE;
        flying.vx *= FLOOR_FRICTION;
        if (Math.abs(flying.vy) < STOP_VY) { finishLanding(reg); return; }
      }

      render();
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }

  function stopFly() {
    flying = null;
    cancelAnimationFrame(raf);
  }

  function finishLanding(reg) {
    stopFly();
    clampToRegion(reg);
    render();
    savePos();
    mode = 'act';
    squish(0.62);
    setClip('land', false);
    window.clearTimeout(actTimer);
    actTimer = window.setTimeout(function () {
      if (mode === 'act') returnToIdle();
    }, 700);
  }

  /* ---------- 点击回应 ---------- */
  function react() {
    mode = 'act';
    squish(0.55);
    playOnce(Math.random() < 0.6 ? 'wave' : 'shy');
  }

  /* ---------- 菜单 ---------- */
  function buildMenu() {
    [
      ['回到初始位置', function () {
        setRegion(viewportRegion());
        root.classList.remove('in-card');
        parkInitial();
      }],
      ['换个动作', function () { playOnce(Math.random() < 0.5 ? 'doze' : 'think'); }],
      ['说句话', function () { say(LINES[Math.floor(Math.random() * LINES.length)], 6000); }]
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
    menu.style.left = Math.max(12, Math.min(x, window.innerWidth - r.width - 12)) + 'px';
    menu.style.top = Math.max(12, Math.min(y, window.innerHeight - r.height - 12)) + 'px';
  }

  function hideMenu() { menu.hidden = true; }

  /* ---------- 视口变化 ---------- */
  function reflow() {
    if (regionIsCard) {
      var card = cardRegion();
      if (card) setRegion(card);
      else setRegion(viewportRegion());
    }
    if (!region) setRegion(viewportRegion());
    clampToRegion(region);
    render();
  }

  /* ---------- 启动 ---------- */
  function init() {
    document.body.appendChild(root);
    loadPos();
    setRegion(viewportRegion());
    if (pos.x === MARGIN && pos.y === 0) parkInitial();
    clampToRegion(region);
    render();
    buildMenu();

    setClip('idle', true);
    scheduleIdleChain();
    scheduleWhisper();

    root.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    root.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      showMenu(e.clientX, e.clientY);
    });
    document.addEventListener('click', hideMenu);

    var queued = false;
    function queueReflow() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        if (!drag && !flying) reflow();
      });
    }
    window.addEventListener('resize', queueReflow);
    window.addEventListener('scroll', queueReflow, { passive: true });

    // 预取常用动作，点击时不至于卡一下
    window.setTimeout(function () {
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
