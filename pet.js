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

  /* 移动端（窄屏 / iOS / iPadOS）不出现宠物：透明视频在 iOS 上只能显示黑底，
     换成静态图又和整体风格不搭，干脆不打扰小屏。 */
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
  var NARROW = !!(window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  if (NARROW || isIOS) return;

  var probe = document.createElement('video');
  var canWebm = !!(probe.canPlayType && probe.canPlayType('video/webm; codecs="vp9"'));
  /* 桌面端万一播不了透明视频，退回静态头像，而不是整个消失 */
  var STATIC_ONLY = !canWebm;

  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var BASE = '/assets/pet/';
  var MEME_BASE = '/assets/pet/memes/';
  /* 动作名 = 素材文件名（中文原名，和 dsh-pet 一致） */
  var IDLE_CLIP = '待机呼吸休闲';
  var DRAG_CLIP = '被鼠标拖拽悬空反馈';
  var LAND_CLIP = '原地重力下蹲压缩';
  var MUMBLE_CLIP = '碎碎念-发呆碎碎念';

  function clipSrc(name) {
    return BASE + encodeURIComponent(name) + '.webm';
  }

  /* 待机时随机抽一个演，点击时随机抽一个回应 */
  var IDLE_ACTS = ['原地小憩沉眠', '哈欠连天', '超大伸懒腰', '东张西望', '照镜子', '撸猫',
    '被吓一跳', '吃白饭', '吃西瓜', '写代码', '原地漂浮踏步', '鲸鱼吐泡泡特效', '轻快记录',
    '原地敲击桌面互动', '悠闲哼歌', '工作状态-思考冒泡'];
  var CLICK_ACTS = ['点击回应-元气挥手', '点击回应-害羞惊讶', '点击回应-开心跃动',
    '点击回应-傲娇生气', '点击回应-挠痒咯咯笑'];

  /* 右键「动作」分支：分类 → 动作名，和 dsh-pet 的菜单同构 */
  var ACTIONS = [
    ['待机', ['待机呼吸休闲', '原地小憩沉眠', '哈欠连天', '打瞌睡被惊醒']],
    ['拖拽', ['被鼠标拖拽悬空反馈', '原地重力下蹲压缩']],
    ['点击回应', ['点击回应-元气挥手', '点击回应-害羞惊讶', '点击回应-开心跃动', '点击回应-傲娇生气', '点击回应-挠痒咯咯笑']],
    ['移动', ['原地左转奔跑', '原地漂浮踏步', '螃蟹走路', '原地跳跃抓碎头顶物品']],
    ['小动作', ['超大伸懒腰', '东张西望', '照镜子', '原地敲击桌面互动', '小幅度原地360度旋转展示',
      '女仆屈膝礼仪', '被吓一跳', '撸猫', '轻快记录', '整体换装试色', '悠闲哼歌']],
    ['玩耍', ['玩水枪', '原地专心玩魔方', '扑克魔术', '荡秋千', '骑木马', '吹气球', '踢毽子', '抽陀螺',
      '原地蹲下玩玩具汽车', '三球抛接', '下五子棋', '玩游戏气急败坏', '吹笛子', '小提琴演奏', '舞狮头',
      '变鸽子', '萌化小幽灵', '动物环绕', '凭空生花', '蝴蝶蜜蜂环绕头顶开花', '蓝鲸现世',
      '鲸鱼吐泡泡特效', '用鲸鱼尾巴拍打地面']],
    ['吃什么', ['吃白饭', '吃早餐', '吃午餐', '吃晚餐', '吃西瓜', '吃冰淇淋融化', '吃大闸蟹', '吃年糕',
      '吃汤圆', '吃粽子', '吃糖葫芦', '吃腊八粥', '吃重阳糕', '吃长寿面', '吃青团', '吃饺子',
      '大口吃零食', '偷吃零食被抓住', '吃Token', '涮火锅', '是啊，吃什么', '晨间刷牙']],
    ['时节', ['中秋赏月吃月饼', '装点圣诞树', '讨糖南瓜灯', '放烟花', '放孔明灯', '放河灯', '堆雪人',
      '插茱萸赏菊', '穿针乞巧', '写福字', '收红包', '摇扇纳凉', '放风筝', '被落叶淹没', '拆礼物']],
    ['跳舞', ['轻快摇摆舞', '优雅女仆舞', '可爱宅舞']],
    ['碎碎念', ['碎碎念-发呆碎碎念', '碎碎念-对屏碎碎念', '碎碎念-擦桌碎碎念', '深度思考碎碎念']],
    ['工作状态', ['工作状态-原地踱步张望', '工作状态-垂头叹气冒汗', '工作状态-忙碌点按',
      '工作状态-思考冒泡', '工作状态-清点归档', '工作状态-雀跃庆祝', '写代码']],
    ['余额档位', ['余额-分文不剩', '余额-数金皱眉', '余额-袋空如洗', '余额-金袋叮当', '余额-钱袋如常', '余额-钱袋满溢']]
  ];

  var MARGIN = 24;          // 视口四周留白
  var INSET = 8;            // 卡片内留白
  var GRAVITY = 1400;
  var RESTITUTION = 0.78;
  var FLOOR_BOUNCE = 0.55;
  var FLOOR_FRICTION = 0.86;
  var STOP_VY = 150;
  var DRAG_THRESHOLD = 6;

  /* 碎碎念：带图的走表情包，没图的就是纯文字 */
  var LINES = [
    { t: '今天也在努力地……吃白饭。', img: '吃白饭的大肥鱼' },
    { t: '除了调情，我好像真没啥用呢。', img: '除了调情没啥用' },
    { t: '别给我压力，我只是条鱼。', img: '压力一只大肥鱼' },
    { t: '今天也很可爱，谢谢。', img: '可爱' },
    { t: '别叫我，我在深度睡眠。', img: '深度睡眠' },
    { t: '先养着吧，反正不占地方。', img: '先养着吧' },
    { t: '哦鲸鲸，原来是这样。', img: '哦鲸鲸' },
    { t: '我死掉了（不是）。', img: '死掉了' },
    { t: '记得把简历看完哦，别只看我的尾巴。' },
    { t: '数学建模 72 小时，我只负责在旁边睡。' },
    { t: '拖我一下试试？会飞的。' },
    { t: 'Deep Thesis 那 448 项测试，全绿了喵。' },
    { t: '这里是 vvosp.top，没有人比我更熟悉这个站。' },
    { t: '他最近在折腾 Cloudflare，电脑终于能关了。' },
    { t: '别光看我，往下滑，项目经历在下面。' },
    { t: '鲸鱼尾巴了解一下，很软的。' },
    { t: '如果你有合作想法，他邮箱在页脚。' },
    { t: '我在这个角落待机，顺便帮你看着页面。' },
    { t: '再点我一下，我给你表演个 Q 弹。' }
  ];

  function pickLine() {
    return LINES[Math.floor(Math.random() * LINES.length)];
  }

  /* ---------- 建 DOM ---------- */
  var root = document.createElement('div');
  root.className = 'site-pet';
  root.setAttribute('aria-hidden', 'true');

  var stage = document.createElement('div');
  stage.className = 'pet-stage';

  var vids = [];
  var vidA = null;
  var vidB = null;

  if (STATIC_ONLY) {
    root.classList.add('static');
    var still = document.createElement('img');
    still.className = 'pet-img';
    still.src = '/assets/pet/avatar-256.png';
    still.alt = '';
    stage.appendChild(still);
  } else {
    vidA = document.createElement('video');
    vidB = document.createElement('video');
    [vidA, vidB].forEach(function (v) {
      v.className = 'pet-video';
      v.muted = true;
      v.playsInline = true;
      v.autoplay = true;
      v.preload = 'auto';
      v.disablePictureInPicture = true;
      stage.appendChild(v);
    });
    vids = [vidA, vidB];
  }

  var bubble = document.createElement('div');
  bubble.className = 'pet-bubble';

  // 视角跟随层：倾斜只作用在这一层，不影响外层的位移和气泡
  var look = document.createElement('div');
  look.className = 'pet-look';
  look.appendChild(stage);

  root.appendChild(look);
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
  var gaze = { tx: 0, ty: 0, cx: 0, cy: 0, raf: 0 };
  var longFired = false;
  /* 低配设备：关掉视角跟随、拉长待机动作间隔，优先保证视频本身流畅 */
  var LOW_END = ((navigator.hardwareConcurrency || 4) <= 4) &&
                ((navigator.deviceMemory || 4) <= 4);


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

    // 地面取输入区上边线：宠物站在输入框上方，不压住打字区域
    var floor = r.bottom;
    var input = document.querySelector('.chat-input');
    if (input) {
      var ir = input.getBoundingClientRect();
      if (ir.top > r.top + 60) floor = ir.top;
    }

    return {
      left: Math.max(0, r.left + INSET),
      top: Math.max(0, r.top + INSET),
      right: Math.min(window.innerWidth, r.right - INSET),
      bottom: Math.min(window.innerHeight, floor - INSET),
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
    // 手机竖屏：贴右下角，避开聊天输入框和「试试问」那一行
    pos.x = NARROW ? Math.max(MARGIN, window.innerWidth - elW() - 16) : MARGIN;
    pos.y = window.innerHeight - elH() - MARGIN;
    render();
    savePos();
  }

  /* ---------- 动画 ---------- */
  var clipToken = 0;

  function setClip(name, loop) {
    if (STATIC_ONLY) { current = name; return; }
    if (current === name) {
      var cur = vids[active];
      if (cur && cur.paused) cur.play().catch(function () {});
      return;
    }

    var next = vids[1 - active];
    var prev = vids[active];
    var token = ++clipToken;

    if (next.getAttribute('data-clip') !== name) {
      next.setAttribute('data-clip', name);
      next.src = clipSrc(name);
    }
    next.loop = !!loop;
    try { next.currentTime = 0; } catch (e) { /* 未就绪 */ }

    // 等新素材真正画出第一帧再交叉；数据没到就继续让旧画面撑着，绝不切到空白
    function reveal() {
      if (token !== clipToken) return;
      if (next.readyState < 2) return;
      next.classList.add('on');
      root.classList.remove('loading');
      if (prev) {
        prev.classList.remove('on');
        // 立刻暂停：暂停后画面停在当前帧，淡出过程看不出差别，但少一个解码器
        try { prev.pause(); } catch (e) {}
      }
      active = 1 - active;
      current = name;
    }

    var settled = false;
    var startedAt = performance.now();
    root.classList.add('loading');           // 等素材时给个视觉反馈

    function finishWait() {
      root.classList.remove('loading');
    }

    function once() {
      if (settled || token !== clipToken) return;
      if (next.readyState < 2) {
        if (performance.now() - startedAt > 5000) {
          // 5 秒还没下下来：放弃这次切换，保持旧画面，清掉标记让下次重试
          settled = true;
          finishWait();
          next.removeAttribute('data-clip');
          return;
        }
        window.setTimeout(once, 300);
        return;
      }
      settled = true;
      finishWait();
      reveal();
    }

    next.addEventListener('loadeddata', function () {
      if (token !== clipToken || settled) return;
      if (next.requestVideoFrameCallback) next.requestVideoFrameCallback(once);
      else once();
    }, { once: true });

    if (next.readyState >= 2) {
      if (next.requestVideoFrameCallback) next.requestVideoFrameCallback(once);
      else once();
    }
    window.setTimeout(once, 2500);

    var played = next.play();
    if (played && played.catch) played.catch(once);
  }

  function scheduleIdleChain() {
    window.clearTimeout(idleTimer);
    if (REDUCED) return;
    idleTimer = window.setTimeout(function () {
      if (mode !== 'idle' || drag || flying) { scheduleIdleChain(); return; }
      if (Math.random() < 0.8) {
        playOnce(IDLE_ACTS[Math.floor(Math.random() * IDLE_ACTS.length)]);
      } else {
        scheduleIdleChain();
      }
    }, (LOW_END ? 16000 : 8000) + Math.random() * (LOW_END ? 14000 : 10000));
  }

  function playOnce(name, ms) {
    mode = 'act';
    setClip(name, false);
    window.clearTimeout(actTimer);

    // 素材播完立刻回待机；定时器只作兜底（网络慢或视频卡住时）
    var target = vids[active];
    function settle() {
      if (mode === 'act' && current === name) returnToIdle();
    }
    if (target) {
      target.addEventListener('ended', function onEnd() {
        target.removeEventListener('ended', onEnd);
        settle();
      });
    }
    actTimer = window.setTimeout(settle, ms || DEFAULT_CLIP_MS[name] || 2600);
  }

  function returnToIdle() {
    mode = 'idle';
    setClip(IDLE_CLIP, true);
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
  function say(text, ms, img) {
    bubble.innerHTML = '';
    if (img) {
      var pic = document.createElement('img');
      pic.className = 'pet-bubble-img';
      pic.alt = '';
      // 图挂了就只留文字，不要留一个空灰块
      pic.onerror = function () {
        if (pic.parentNode) pic.parentNode.removeChild(pic);
      };
      pic.src = MEME_BASE + encodeURIComponent(img) + '.webp';
      bubble.appendChild(pic);
    }
    var line = document.createElement('span');
    line.textContent = text;
    bubble.appendChild(line);

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
      var line = pickLine();
      playOnce(MUMBLE_CLIP);
      say(line.t, 7000, line.img);
      scheduleWhisper();
    }, 75000 + Math.random() * 60000);
  }

  /* ---------- 视角跟随 ---------- */
  var LOOK_MAX_Y = 10;     // 左右转头角度
  var LOOK_MAX_X = 7;     // 上下点头角度

  var lastAim = 0;

  function aimGaze(e) {
    if (drag || flying || REDUCED || LOW_END) return;
    if (mode !== 'idle') return;              // 播动作时别再改 transform
    var now = performance.now();
    if (now - lastAim < 33) return;           // 30fps 够了
    lastAim = now;
    var r = root.getBoundingClientRect();
    if (!r.width) return;
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    // 固定参考半径：宠物周围 420px 内线性转头，再远就饱和
    var REF = 420;
    gaze.tx = clamp((e.clientX - cx) / REF, -1, 1);
    gaze.ty = clamp((e.clientY - cy) / REF, -1, 1);
    if (!gaze.raf) gaze.raf = requestAnimationFrame(stepGaze);
  }

  function stepGaze() {
    gaze.raf = 0;
    gaze.cx += (gaze.tx - gaze.cx) * 0.12;
    gaze.cy += (gaze.ty - gaze.cy) * 0.12;
    look.style.transform =
      'rotateY(' + (gaze.cx * LOOK_MAX_Y).toFixed(2) + 'deg) ' +
      'rotateX(' + (-gaze.cy * LOOK_MAX_X).toFixed(2) + 'deg) ' +
      'translate3d(' + (gaze.cx * 4).toFixed(1) + 'px,' + (gaze.cy * 3).toFixed(1) + 'px,0)';

    if (Math.abs(gaze.tx - gaze.cx) > 0.004 || Math.abs(gaze.ty - gaze.cy) > 0.004) {
      gaze.raf = requestAnimationFrame(stepGaze);
    } else {
      // 稳住后把最终角度的常驻状态保留，避免下一帧抖动
      gaze.cx = gaze.tx;
      gaze.cy = gaze.ty;
    }
  }

  function relaxGaze() {
    gaze.tx = 0;
    gaze.ty = 0;
    if (!gaze.raf) gaze.raf = requestAnimationFrame(stepGaze);
  }

  /* ---------- 拖拽 ---------- */
  function pointer(e) { return { x: e.clientX, y: e.clientY }; }

  function onDown(e) {
    if (e.button !== 0) return;
    hideMenu();
    relaxGaze();
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
    root.classList.add('dragging');
    if (root.setPointerCapture) { try { root.setPointerCapture(e.pointerId); } catch (err) {} }
    e.preventDefault();
  }

  function onMove(e) {
    if (!drag) return;
    var p = pointer(e);
    var dx = p.x - drag.startX;
    var dy = p.y - drag.startY;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
      drag.moved = true;
      mode = 'drag';
      setClip(DRAG_CLIP, true);      // 确认在拖了才切动画，纯点击不再闪一次拖拽
    }
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
    var trail = drag.trail;
    drag = null;
    root.classList.remove('dragging');

    if (!moved) {
      if (longFired) { longFired = false; return; }
      react();
      return;
    }

    // 只用松手前 300ms 的轨迹估速：末尾停顿会被算成 0，不会因为整段拖拽的平均速度误判成甩出
    var now = performance.now();
    var recent = trail.filter(function (p) { return now - p.t <= 300; });
    var vx = 0, vy = 0, speed = 0;
    if (recent.length >= 2) {
      var f = recent[0];
      var l = recent[recent.length - 1];
      var dt = Math.max(16, l.t - f.t) / 1000;
      vx = (l.x - f.x) / dt;
      vy = (l.y - f.y) / dt;
      speed = Math.sqrt(vx * vx + vy * vy);
    }

    var cx = pos.x + elW() / 2;
    var cy = pos.y + elH() / 2;
    var r = pickRegion(cx, cy);
    setRegion(r);
    clampToRegion(r);

    if (speed < 260 || REDUCED) {
      // 卡片内取消「温柔放下」：一律落到输入框上方的地面
      if (r.card) {
        if (REDUCED) {
          pos.y = Math.max(r.top, r.bottom - elH());
          render();
          savePos();
          squish(0.8);
          returnToIdle();
          return;
        }
        startFly(vx * 0.12, vy * 0.12, r);
        return;
      }
      // 卡片外保持桌宠手感：停在当前位置
      render();
      savePos();
      squish(0.8);
      returnToIdle();
      return;
    }

    startFly(vx * 0.55, vy * 0.55, r);
  }

  /* ---------- 抛掷物理 ---------- */
  function startFly(vx, vy, r) {
    flying = { vx: vx, vy: vy, region: r };
    mode = 'fly';
    setClip(DRAG_CLIP, true);
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
    setClip(LAND_CLIP, false);
    window.clearTimeout(actTimer);
    actTimer = window.setTimeout(function () {
      if (mode === 'act') returnToIdle();
    }, 700);
  }

  /* ---------- 点击回应 ---------- */
  function react() {
    mode = 'act';
    squish(0.55);
    playOnce(CLICK_ACTS[Math.floor(Math.random() * CLICK_ACTS.length)]);
  }

  /* ---------- 菜单 ---------- */
  /** 同一层级只允许展开一个面板，否则多个三级面板会叠在一起 */
  function closeSiblings(selector, keep) {
    var list = menu.querySelectorAll(selector);
    for (var i = 0; i < list.length; i++) {
      if (list[i] !== keep) list[i].classList.remove('open');
    }
  }

  /** 子菜单超出视口时向上挪，避免在屏幕底部点不到 */
  function fitSub(host, sub) {
    sub.style.top = '0px';
    requestAnimationFrame(function () {
      var hr = host.getBoundingClientRect();
      var h = Math.min(window.innerHeight * 0.7, sub.scrollHeight + 12);
      var over = hr.top + h - (window.innerHeight - 12);
      sub.style.top = (over > 0 ? -over : 0) + 'px';
    });
  }

  /** 二级分类悬停即展开对应三级，移开切到别的分类 */
  function bindHover(host, panel) {
    var timer = 0;
    function openPanel() {
      window.clearTimeout(timer);
      closeSiblings('.pet-menu-sub2', panel);
      panel.classList.add('open');
      fitSub(host, panel);
    }
    function closePanel() {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        panel.classList.remove('open');
      }, 180);
    }
    host.addEventListener('mouseenter', function (e) {
      if (panel.contains(e.relatedTarget)) return;
      openPanel();
    });
    host.addEventListener('mouseleave', function (e) {
      if (panel.contains(e.relatedTarget)) return;
      closePanel();
    });
    panel.addEventListener('mouseenter', function () { window.clearTimeout(timer); });
    panel.addEventListener('mouseleave', function (e) {
      if (host.contains(e.relatedTarget)) return;
      closePanel();
    });
  }

  /** 预取一串动作素材，间隔 gap 毫秒 */
  function prefetchClips(names, gap) {
    var i = 0;
    (function next() {
      if (i >= names.length) return;
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'video';
      link.href = clipSrc(names[i++]);
      document.head.appendChild(link);
      window.setTimeout(next, gap || 400);
    })();
  }

  function buildMenu() {
    // 「动作」分支：分类 → 具体动画，层级和 dsh-pet 一致
    var group = document.createElement('div');
    group.className = 'pet-menu-group';

    var head = document.createElement('button');
    head.type = 'button';
    head.className = 'pet-menu-cat';
    head.innerHTML = '<span>动作</span><i>›</i>';
    head.addEventListener('click', function (e) {
      e.stopPropagation();
      var opening = !sub.classList.contains('open');
      sub.classList.toggle('open', opening);
      if (opening) {
        closeSiblings('.pet-menu-sub2');     // 收起所有三级
        fitSub(group, sub);
      }
    });

    var sub = document.createElement('div');
    sub.className = 'pet-menu-sub';

    ACTIONS.forEach(function (cat) {
      var row = document.createElement('div');
      row.className = 'pet-menu-cat-row';

      var catBtn = document.createElement('button');
      catBtn.type = 'button';
      catBtn.className = 'pet-menu-cat';
      catBtn.innerHTML = '<span>' + cat[0] + '</span><i>›</i>';
      catBtn.addEventListener('mouseenter', function () {
        prefetchClips(cat[1].slice(0, 5), 260);   // 悬停就把这一类的头几个拉下来
      }, { once: true });

      catBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var opening = !sub2.classList.contains('open');
        sub2.classList.toggle('open', opening);
        if (opening) {
          closeSiblings('.pet-menu-sub2', sub2);
          fitSub(row, sub2);
        }
      });

      var sub2 = document.createElement('div');
      sub2.className = 'pet-menu-sub2';
      cat[1].forEach(function (name) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pet-menu-item';
        b.textContent = name;
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          hideMenu();
          playOnce(name, 10000);      // 点播就完整播一段
        });
        sub2.appendChild(b);
      });

      row.appendChild(catBtn);
      row.appendChild(sub2);
      bindHover(row, sub2);
      sub.appendChild(row);
    });

    group.appendChild(head);
    group.appendChild(sub);
    menu.appendChild(group);

    // 子菜单在视口底部/右侧溢出时纠偏（宠物常在左下角，二级菜单会顶出屏幕）
    menu.addEventListener('mouseover', function (e) {
      var host = e.target && e.target.closest ? e.target.closest('.pet-menu-group, .pet-menu-cat-row') : null;
      if (!host) return;
      var sub = host.querySelector(':scope > .pet-menu-sub, :scope > .pet-menu-sub2');
      if (!sub) return;
      fitSub(host, sub);
    });

    var mumble = document.createElement('button');
    mumble.type = 'button';
    mumble.className = 'pet-menu-plain';
    mumble.textContent = '碎碎念';
    mumble.addEventListener('click', function (e) {
      e.stopPropagation();
      hideMenu();
      var clicked = pickLine();
      playOnce(MUMBLE_CLIP, 6000);
      say(clicked.t, 7000, clicked.img);
    });
    menu.appendChild(mumble);

    var home = document.createElement('button');
    home.type = 'button';
    home.className = 'pet-menu-plain';
    home.textContent = '回到初始位置';
    home.addEventListener('click', function (e) {
      e.stopPropagation();
      hideMenu();
      setRegion(viewportRegion());
      parkInitial();
    });
    menu.appendChild(home);
  }

  function showMenu(x, y) {
    menu.hidden = false;
    menu.classList.toggle('flip', x > window.innerWidth * 0.62);
    var r = menu.getBoundingClientRect();
    menu.style.left = Math.max(12, Math.min(x, window.innerWidth - r.width - 12)) + 'px';
    menu.style.top = Math.max(12, Math.min(y, window.innerHeight - r.height - 12)) + 'px';
  }

  function hideMenu() {
    menu.hidden = true;
    // 回收所有展开的面板，下次右键从干净状态开始
    var opened = menu.querySelectorAll('.open');
    for (var i = 0; i < opened.length; i++) opened[i].classList.remove('open');
    var subs = menu.querySelectorAll('.pet-menu-sub, .pet-menu-sub2');
    for (var j = 0; j < subs.length; j++) subs[j].style.top = '';
  }

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

    setClip(IDLE_CLIP, true);
    if (!STATIC_ONLY) {
      scheduleIdleChain();
    }
    scheduleWhisper();

    root.addEventListener('pointerdown', onDown);

    // 触屏没有右键：长按 550ms 弹菜单
    var longTimer = 0;
    root.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      longFired = false;
      window.clearTimeout(longTimer);
      longTimer = window.setTimeout(function () {
        longFired = true;
        showMenu(e.clientX, e.clientY);
      }, 550);
    });
    root.addEventListener('pointermove', function () {
      if (drag && drag.moved) { window.clearTimeout(longTimer); }
    });
    ['pointerup', 'pointercancel'].forEach(function (evt) {
      root.addEventListener(evt, function () { window.clearTimeout(longTimer); });
    });
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
    document.addEventListener('mousemove', aimGaze, { passive: true });
    document.addEventListener('mouseleave', relaxGaze);

    // 碎碎念配图一共不到 200KB，提前全拉下来，气泡出来就有图
    window.setTimeout(function () {
      LINES.forEach(function (l) {
        if (!l.img) return;
        var pic = new Image();
        pic.src = MEME_BASE + encodeURIComponent(l.img) + '.webp';
      });
    }, 2500);

    window.setTimeout(function () {
      if (STATIC_ONLY || LOW_END) return;      // 低配设备别抢带宽和解码
      prefetchClips(['点击回应-元气挥手', '点击回应-害羞惊讶', '原地小憩沉眠'], 600);
      window.setTimeout(function () {
        prefetchClips(['工作状态-思考冒泡', '碎碎念-发呆碎碎念', '吃白饭', '东张西望', '轻快摇摆舞'], 2000);
      }, 5000);
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
