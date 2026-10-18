/* Homepage-only seasonal animation. Runs once, then fades. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var data = document.getElementById("season-fx-data");
  if (!data) return;
  var all;
  try { all = JSON.parse(data.textContent); } catch (e) { return; }
  var id = document.documentElement.getAttribute("data-season");
  var fx = all && all[id] && all[id].fx;
  if (!fx || !fx.kind) return;

  var header = document.querySelector(".top");
  var top = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  var viewH = window.innerHeight;
  var viewW = window.innerWidth;
  if (viewH - top < 80) return;

  var canvas = document.createElement("canvas");
  canvas.className = "season-fx";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.top = top + "px";
  canvas.style.height = (viewH - top) + "px";
  document.body.appendChild(canvas);

  var ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) { canvas.remove(); return; }

  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  var width = viewW;
  var height = viewH - top;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  var duration = Math.min(6000, Math.max(4000, fx.duration || 5000));
  var fadeMs = 800;
  var count = Math.min(40, Math.max(8, fx.count || 24));
  if (width < 700) count = Math.max(8, Math.round(count * 0.65));
  var colors = fx.colors && fx.colors.length ? fx.colors : ["#ffffff"];
  var parts = [];
  var i;
  for (i = 0; i < count; i++) parts.push(spawn(true));

  function spawn(anywhere) {
    var r = fx.kind === "snow" ? 1.1 + Math.random() * 2.1 : 2.2 + Math.random() * 2.6;
    return {
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : -12,
      r: r,
      vx: fx.kind === "firefly" ? (Math.random() - 0.5) * 0.35 : (Math.random() - 0.5) * 0.45,
      vy: fx.kind === "firefly" ? (Math.random() - 0.5) * 0.28 : 0.35 + Math.random() * (fx.kind === "snow" ? 0.85 : 0.7),
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.03,
      phase: Math.random() * Math.PI * 2,
      color: colors[i % colors.length],
      a: 0.35 + Math.random() * 0.4,
    };
  }

  function draw(p, alpha) {
    ctx.globalAlpha = p.a * alpha;
    ctx.fillStyle = p.color;
    if (fx.kind === "snow") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (fx.kind === "firefly") {
      ctx.globalAlpha = p.a * alpha * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(p.phase)));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r * (fx.kind === "leaf" ? 0.72 : 0.5), p.r * (fx.kind === "leaf" ? 1.15 : 1), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  var start = performance.now();
  var running = true;

  function frame(now) {
    if (!running) return;
    var elapsed = now - start;
    var alpha = elapsed <= duration ? 1 : 1 - (elapsed - duration) / fadeMs;
    if (alpha <= 0) {
      running = false;
      canvas.remove();
      return;
    }
    ctx.clearRect(0, 0, width, height);
    var n = parts.length;
    for (var p = 0; p < n; p++) {
      var part = parts[p];
      part.x += part.vx + (fx.kind === "firefly" ? 0 : Math.sin(part.phase) * 0.15);
      part.y += part.vy;
      part.rot += part.vr;
      part.phase += 0.04;
      if (part.y > height + 16) part.y = -12;
      if (part.x < -16) part.x = width + 8;
      if (part.x > width + 16) part.x = -8;
      draw(part, alpha);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
