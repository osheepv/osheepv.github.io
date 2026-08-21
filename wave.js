/*
 * wave.js v2 — 俯视水面涟漪背景（WebGL GPU 着色器渲染 + Canvas2D 降级）
 * ------------------------------------------------------------------
 * GPU 路径：波动方程在 fragment shader 里用双缓冲纹理（ping-pong）迭代，
 *          主线程每帧只做 2 次 draw call + uniform 更新，解放 CPU。
 *          帧率放开到 60fps（原 Canvas2D 版本 30fps 限帧）。
 * 降级路径：WebGL 不可用 / 着色器编译失败时，自动回退 Canvas2D 实现，
 *          视觉与旧版完全一致。
 * 保留特性：鼠标/触摸整页扰动、prefers-reduced-motion 静态帧、
 *          标签页隐藏暂停。
 */
(function () {
  'use strict';
  var canvases = document.querySelectorAll('#wave-canvas');
  if (!canvases.length) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Array.prototype.forEach.call(canvases, function (canvas) {
    var gl = null;
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false })
        || canvas.getContext('experimental-webgl', { alpha: true });
    } catch (e) { gl = null; }
    if (gl && initWebGL(canvas, gl)) return;
    runCanvas2D(canvas);
  });

  /* ============ WebGL GPU 路径 ============ */
  function initWebGL(canvas, gl) {
    var VERT =
      'attribute vec2 aPos;' +
      'varying vec2 vUv;' +
      'void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }';

    /* 波动迭代 pass：纹理 R=当前高度，G=上一帧高度；输出 R=新高度，G=当前高度
     * 注意：WebGL 1 (GLSL ES 1.00) 不允许用循环变量索引 uniform 数组，
     *       所以 8 个 poke 必须展开为独立 uniform uPoke0..uPoke7。 */
    var STEP_FS = [
      'precision mediump float;',
      'varying vec2 vUv;',
      'uniform sampler2D uTex;',
      'uniform vec2 uTexel;',
      'uniform float uDamp;',
      'uniform vec2 uSimSize;',
      'uniform vec4 uPoke0; uniform vec4 uPoke1; uniform vec4 uPoke2; uniform vec4 uPoke3;',
      'uniform vec4 uPoke4; uniform vec4 uPoke5; uniform vec4 uPoke6; uniform vec4 uPoke7;',
      'void main(){',
      '  vec2 uv = vUv;',
      '  bool edge = uv.x <= uTexel.x * 1.5 || uv.x >= 1.0 - uTexel.x * 1.5 ||',
      '              uv.y <= uTexel.y * 1.5 || uv.y >= 1.0 - uTexel.y * 1.5;',
      '  float h = 0.0; h += uPoke0.z + uPoke1.z + uPoke2.z + uPoke3.z + uPoke4.z + uPoke5.z + uPoke6.z + uPoke7.z; /* DEBUG: 累加 uPoke.z */',
      '  if (!edge) {',
      '    float c = texture2D(uTex, uv).r;',
      '    float p = texture2D(uTex, uv).g;',
      '    float l = texture2D(uTex, uv + vec2(-uTexel.x, 0.0)).r;',
      '    float r = texture2D(uTex, uv + vec2( uTexel.x, 0.0)).r;',
      '    float t = texture2D(uTex, uv + vec2(0.0, -uTexel.y)).r;',
      '    float b = texture2D(uTex, uv + vec2(0.0,  uTexel.y)).r;',
      '    h = (l + r + t + b) * 0.5 - p;',
      '    h *= uDamp;',
      '    vec4 pk;',
      '    pk = uPoke0; if (pk.z > 0.0) { float d = length(uv - pk.xy) * uSimSize.x; if (d < pk.w) h += pk.z * (1.0 - d / pk.w); }',
      '    pk = uPoke1; if (pk.z > 0.0) { float d = length(uv - pk.xy) * uSimSize.x; if (d < pk.w) h += pk.z * (1.0 - d / pk.w); }',
      '    pk = uPoke2; if (pk.z > 0.0) { float d = length(uv - pk.xy) * uSimSize.x; if (d < pk.w) h += pk.z * (1.0 - d / pk.w); }',
      '    pk = uPoke3; if (pk.z > 0.0) { float d = length(uv - pk.xy) * uSimSize.x; if (d < pk.w) h += pk.z * (1.0 - d / pk.w); }',
      '    pk = uPoke4; if (pk.z > 0.0) { float d = length(uv - pk.xy) * uSimSize.x; if (d < pk.w) h += pk.z * (1.0 - d / pk.w); }',
      '    pk = uPoke5; if (pk.z > 0.0) { float d = length(uv - pk.xy) * uSimSize.x; if (d < pk.w) h += pk.z * (1.0 - d / pk.w); }',
      '    pk = uPoke6; if (pk.z > 0.0) { float d = length(uv - pk.xy) * uSimSize.x; if (d < pk.w) h += pk.z * (1.0 - d / pk.w); }',
      '    pk = uPoke7; if (pk.z > 0.0) { float d = length(uv - pk.xy) * uSimSize.x; if (d < pk.w) h += pk.z * (1.0 - d / pk.w); }',
      '  }',
      '  gl_FragColor = vec4(h, texture2D(uTex, uv).r, 0.0, 1.0);',
      '}'
    ].join('\n');

    /* 波光渲染 pass：由高度场斜率产生白色亮部 + 三光源渐变暗部，半透明叠加 */
    var RENDER_FS = [
      'precision mediump float;',
      'varying vec2 vUv;',
      'uniform sampler2D uH;',
      'uniform vec2 uTexel;',
      'uniform float uScale;',
      'void main(){',
      '  vec2 uv = vUv;',
      '  float l = texture2D(uH, uv + vec2(-uTexel.x, 0.0)).r;',
      '  float r = texture2D(uH, uv + vec2( uTexel.x, 0.0)).r;',
      '  float t = texture2D(uH, uv + vec2(0.0, -uTexel.y)).r;',
      '  float b = texture2D(uH, uv + vec2(0.0,  uTexel.y)).r;',
      '  float s = ((r - l) + (b - t)) * uScale;',
      '  float d1 = distance(uv, vec2(0.18, 0.12)) + 0.001;',
      '  float d2 = distance(uv, vec2(0.82, 0.08)) + 0.001;',
      '  float d3 = distance(uv, vec2(0.50, 1.00)) + 0.001;',
      '  float w1 = 1.0 / d1, w2 = 1.0 / d2, w3 = 1.0 / d3;',
      '  float ws = w1 + w2 + w3;',
      '  vec3 tint = (vec3(130.0, 175.0, 230.0) * w1 + vec3(165.0, 150.0, 235.0) * w2 + vec3(120.0, 205.0, 220.0) * w3) / ws / 255.0;',
      '  float A; vec3 col;',
      '  if (s >= 0.0) { col = vec3(1.0); A = s * 0.022; }',
      '  else { col = tint; A = (-s) * 0.015; }',
      '  A = min(A, 0.16);',
      '  gl_FragColor = vec4(col, A);',
      '}'
    ].join('\n');

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        if (window.console) console.warn('wave.js shader compile failed:', gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    }
    function link(vs, fs) {
      var p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        if (window.console) console.warn('wave.js program link failed:', gl.getProgramInfoLog(p));
        gl.deleteProgram(p);
        return null;
      }
      return p;
    }
    var vs = compile(gl.VERTEX_SHADER, VERT);
    var stepProg = vs && link(vs, compile(gl.FRAGMENT_SHADER, STEP_FS));
    var renderProg = vs && link(vs, compile(gl.FRAGMENT_SHADER, RENDER_FS));
    if (vs) gl.deleteShader(vs);
    if (!stepProg || !renderProg) return false;

    /* 全屏 quad */
    var quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    function bindQuad(p) {
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      var loc = gl.getAttribLocation(p, 'aPos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    /* uniform 位置缓存 */
    var uStep = {
      tex: gl.getUniformLocation(stepProg, 'uTex'),
      texel: gl.getUniformLocation(stepProg, 'uTexel'),
      damp: gl.getUniformLocation(stepProg, 'uDamp'),
      size: gl.getUniformLocation(stepProg, 'uSimSize')
    };
    var MAX_POKES = 8;
    var uPokeLoc = [];
    for (var pi = 0; pi < MAX_POKES; pi++) {
      uPokeLoc[pi] = gl.getUniformLocation(stepProg, 'uPoke' + pi);
    }
    var uRend = {
      tex: gl.getUniformLocation(renderProg, 'uH'),
      texel: gl.getUniformLocation(renderProg, 'uTexel'),
      scale: gl.getUniformLocation(renderProg, 'uScale')
    };

    var DAMP = 0.975;
    var POKE_NORM = 128;          // 幅值归一化（纹理域）
    var POKE_RAD = 2.0;          // 扰动半径（sim 纹理像素）

    var W = 0, H = 0, DPR = 1, simW = 0, simH = 0;
    var texA = null, texB = null, fbA = null, fbB = null;
    var curTex = null;

    function makeTarget(w, h) {
      function mk() {
        var t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        return t;
      }
      function mf(t) {
        var f = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
        return f;
      }
      var a = mk(), b = mk();
      return { a: a, b: b, fa: mf(a), fb: mf(b) };
    }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      gl.viewport(0, 0, canvas.width, canvas.height);
      simW = Math.max(64, Math.min(256, Math.round(W / 8)));
      simH = Math.max(64, Math.min(256, Math.round(H / 8)));
      if (texA) { gl.deleteTexture(texA); gl.deleteTexture(texB); gl.deleteFramebuffer(fbA); gl.deleteFramebuffer(fbB); }
      var t = makeTarget(simW, simH);
      texA = t.a; texB = t.b; fbA = t.fa; fbB = t.fb;
      curTex = texB; // 首帧画到 A
      /* 关键：texImage2D(..., null) 初始化的纹理内容是未定义的，
       *       必须先清零，否则迭代 shader 读到垃圾值。 */
      gl.clearColor(0, 0, 0, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbA); gl.viewport(0, 0, simW, simH); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbB); gl.viewport(0, 0, simW, simH); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    resize();

    /* 扰动注入：事件产生的 poke 先进队列，下一帧迭代时经 uniform 一次性写入高度场 */
    var pokes = [];                       // 待注入队列（本帧消费）
    var pokeArr = new Float32Array(MAX_POKES * 4); // uniform 数组缓冲
    function poke(px, py, mag) {
      pokes.push({ x: px / W, y: py / H, m: mag / POKE_NORM, r: POKE_RAD });
      if (pokes.length > MAX_POKES) pokes.shift();
    }

    var pmouse = null;
    function pointer(e) {
      var p = { x: e.clientX, y: e.clientY };
      if (pmouse) {
        var dx = p.x - pmouse.x, dy = p.y - pmouse.y;
        var dist = Math.hypot(dx, dy);
        var mag = Math.min(Math.max(dist * 0.55, 4), 64);
        var steps = Math.max(1, Math.floor(dist / 8));
        for (var s = 0; s <= steps; s++) poke(pmouse.x + dx * (s / steps), pmouse.y + dy * (s / steps), mag);
      }
      pmouse = p;
    }
    window.addEventListener('mousemove', pointer);
    window.addEventListener('touchmove', function (e) {
      var t = e.touches[0];
      if (t) pointer(t);
    }, { passive: true });
    window.addEventListener('mouseleave', function () { pmouse = null; });

    /* 一次迭代 pass：读 srcTex，把新状态写进另一个纹理，并交换 */
    function stepPass() {
      var dst = (curTex === texA) ? texB : texA;
      var dstFb = (dst === texA) ? fbA : fbB;
      gl.bindFramebuffer(gl.FRAMEBUFFER, dstFb);
      gl.viewport(0, 0, simW, simH);
      gl.useProgram(stepProg);
      bindQuad(stepProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, curTex);
      gl.uniform1i(uStep.tex, 0);
      gl.uniform2f(uStep.texel, 1 / simW, 1 / simH);
      gl.uniform1f(uStep.damp, DAMP);
      gl.uniform2f(uStep.size, simW, simH);
      for (var i = 0; i < MAX_POKES; i++) {
        var v = (i < pokes.length) ? [pokes[i].x, pokes[i].y, pokes[i].m, pokes[i].r] : [0, 0, 0, 0];
        gl.uniform4f(uPokeLoc[i], v[0], v[1], v[2], v[3]);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      curTex = dst;
      pokes.length = 0; // 注入完成，清空队列
    }

    /* 波光渲染到屏幕 */
    function renderPass() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(renderProg);
      bindQuad(renderProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, curTex);
      gl.uniform1i(uRend.tex, 0);
      gl.uniform2f(uRend.texel, 1 / simW, 1 / simH);
      gl.uniform1f(uRend.scale, POKE_NORM);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disable(gl.BLEND);
    }

    var rafId = null, running = false;
    function frame() {
      if (!running) return;
      stepPass();
      renderPass();
      rafId = requestAnimationFrame(frame);
    }
    function start() {
      if (running || reduceMotion) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    window.addEventListener('resize', function () { resize(); });

    if (reduceMotion) {
      /* 静态帧：两处扰动 + 40 次迭代 + 渲染一次 */
      poke(W * 0.5, H * 0.45, 50);
      poke(W * 0.3, H * 0.6, 36);
      for (var f = 0; f < 40; f++) stepPass();
      renderPass();
    } else {
      start();
    }
    return true;
  }

  /* ============ Canvas2D 降级路径（原实现） ============ */
  function runCanvas2D(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var W = 0, H = 0, DPR = 1;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();

    var CELL = 10;
    var DAMP = 0.975;
    var cur, prev, cols, rows, off, offCtx, img, tintR, tintG, tintB;

    function buildTint() {
      tintR = new Float32Array(cols * rows);
      tintG = new Float32Array(cols * rows);
      tintB = new Float32Array(cols * rows);
      var c1 = [130, 175, 230], c2 = [165, 150, 235], c3 = [120, 205, 220];
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var i = y * cols + x;
          var fx = x / (cols - 1), fy = y / (rows - 1);
          var d1 = Math.hypot(fx - 0.18, fy - 0.12) + 0.001;
          var d2 = Math.hypot(fx - 0.82, fy - 0.08) + 0.001;
          var d3 = Math.hypot(fx - 0.50, fy - 1.00) + 0.001;
          var w1 = 1 / d1, w2 = 1 / d2, w3 = 1 / d3, ws = w1 + w2 + w3;
          tintR[i] = (c1[0] * w1 + c2[0] * w2 + c3[0] * w3) / ws;
          tintG[i] = (c1[1] * w1 + c2[1] * w2 + c3[1] * w3) / ws;
          tintB[i] = (c1[2] * w1 + c2[2] * w2 + c3[2] * w3) / ws;
        }
      }
    }

    function allocGrid() {
      cols = Math.max(8, Math.floor(W / CELL));
      rows = Math.max(8, Math.floor(H / CELL));
      cur = new Float32Array(cols * rows);
      prev = new Float32Array(cols * rows);
      off = document.createElement('canvas');
      off.width = cols; off.height = rows;
      offCtx = off.getContext('2d');
      img = offCtx.createImageData(cols, rows);
      buildTint();
    }
    allocGrid();

    function poke(px, py, mag) {
      var cx = Math.floor(px / CELL), cy = Math.floor(py / CELL), r = 2;
      for (var oy = -r; oy <= r; oy++) for (var ox = -r; ox <= r; ox++) {
        var x = cx + ox, y = cy + oy;
        if (x < 1 || y < 1 || x >= cols - 1 || y >= rows - 1) continue;
        var fall = 1 - Math.hypot(ox, oy) / (r + 1);
        cur[y * cols + x] += mag * fall;
      }
    }
    var pmouse = null;
    function pointer(e) {
      var p = { x: e.clientX, y: e.clientY };
      if (pmouse) {
        var dx = p.x - pmouse.x, dy = p.y - pmouse.y;
        var dist = Math.hypot(dx, dy);
        var mag = Math.min(Math.max(dist * 0.55, 4), 64);
        var steps = Math.max(1, Math.floor(dist / CELL));
        for (var s = 0; s <= steps; s++) poke(pmouse.x + dx * (s / steps), pmouse.y + dy * (s / steps), mag);
      }
      pmouse = p;
    }
    window.addEventListener('mousemove', pointer);
    window.addEventListener('touchmove', function (e) {
      var t = e.touches[0];
      if (t) pointer(t);
    }, { passive: true });
    window.addEventListener('mouseleave', function () { pmouse = null; });

    function step() {
      for (var y = 1; y < rows - 1; y++) {
        for (var x = 1; x < cols - 1; x++) {
          var i = y * cols + x;
          var v = (cur[i - 1] + cur[i + 1] + cur[i - cols] + cur[i + cols]) * 0.5 - prev[i];
          v *= DAMP;
          prev[i] = v;
        }
      }
      var tmp = cur; cur = prev; prev = tmp;
    }

    function render() {
      var data = img.data;
      for (var y = 1; y < rows - 1; y++) {
        for (var x = 1; x < cols - 1; x++) {
          var i = y * cols + x;
          var sx = cur[i + 1] - cur[i - 1];
          var sy = cur[i + cols] - cur[i - cols];
          var s = sx + sy;
          var p = i * 4;
          var R, G, B, A;
          if (s >= 0) { R = 255; G = 255; B = 255; A = s * 0.022; }
          else { R = tintR[i]; G = tintG[i]; B = tintB[i]; A = (-s) * 0.015; }
          if (A > 0.16) A = 0.16;
          data[p] = R; data[p + 1] = G; data[p + 2] = B;
          data[p + 3] = Math.min(255, Math.max(0, A * 255)) | 0;
        }
      }
      offCtx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, W, H);
    }

    var rafId = null, running = false, lastT = 0;
    var FRAME_MS = 1000 / 30;

    function frame(ts) {
      if (!running) return;
      if (ts - lastT >= FRAME_MS) {
        lastT = ts;
        step();
        render();
      }
      rafId = requestAnimationFrame(frame);
    }
    function start() {
      if (running || reduceMotion) return;
      running = true;
      lastT = 0;
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    window.addEventListener('resize', function () { resize(); allocGrid(); });

    if (reduceMotion) {
      poke(W * 0.5, H * 0.45, 50);
      poke(W * 0.3, H * 0.6, 36);
      for (var f = 0; f < 40; f++) step();
      render();
    } else {
      start();
    }
  }
})();
