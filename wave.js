/*
 * wave.js — 俯视水面物理涟漪背景（共享）
 * 在每个含 <canvas id="wave-canvas"> 的页面里，以其父容器为响应区域：
 * 鼠标/触摸在区域内移动即扰动水面，速度越快波幅越大，涟漪真实辐射/干涉/衰减。
 * 尊重 prefers-reduced-motion（静态降级）。
 */
(function () {
  var canvases = document.querySelectorAll('#wave-canvas');
  if (!canvases.length) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Array.prototype.forEach.call(canvases, function (canvas) {
    var ctx = canvas.getContext('2d');
    var area = canvas.parentElement;
    var W = 0, H = 0, DPR = 1;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = area.clientWidth; H = area.clientHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();

    var CELL = 10;        // 模拟网格分辨率（像素/格）
    var DAMP = 0.975;     // 阻尼：越接近 1 涟漪存活越久
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

    function toLocal(e) {
      var rct = area.getBoundingClientRect();
      return { x: e.clientX - rct.left, y: e.clientY - rct.top };
    }
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
      var p = toLocal(e);
      if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) return; // 仅在 canvas 父区域内响应
      if (pmouse) {
        var dx = p.x - pmouse.x, dy = p.y - pmouse.y;
        var dist = Math.hypot(dx, dy);
        var mag = Math.min(Math.max(dist * 0.55, 4), 64); // 物理：速度越快扰动越大
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

    function loop() { step(); render(); requestAnimationFrame(loop); }

    window.addEventListener('resize', function () { resize(); allocGrid(); });

    if (reduceMotion) {
      poke(W * 0.5, H * 0.45, 50);
      poke(W * 0.3, H * 0.6, 36);
      for (var f = 0; f < 40; f++) step();
      render();
    } else {
      loop();
    }
  });
})();
