/* Homepage seasonal motion. Hero burst, then a light ambient state. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var SEEN = "franconia-season-fx";
  var state = null;

  function shade(hex, amt) {
    var n = parseInt(String(hex).replace("#", ""), 16);
    if (!Number.isFinite(n)) return "#ffffff";
    function ch(v) { return Math.max(0, Math.min(255, v)); }
    var r = ch((n >> 16) + amt);
    var g = ch(((n >> 8) & 255) + amt);
    var b = ch((n & 255) + amt);
    return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function makeCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function paintFlake(variant) {
    var s = 128;
    var c = makeCanvas(s, s);
    var g = c.getContext("2d");
    function arms(ox, oy, color, alpha, width) {
      g.save();
      g.translate(s / 2 + ox, s / 2 + oy);
      g.strokeStyle = color;
      g.fillStyle = color;
      g.globalAlpha = alpha;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.lineWidth = width;
      var arm = variant === 3 ? 40 : 50;
      var i;
      for (i = 0; i < 6; i++) {
        g.rotate(Math.PI / 3);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(0, arm);
        g.stroke();
        branch(g, arm * (0.36 + (variant % 3) * 0.06), arm * (variant === 1 ? 0.22 : 0.16));
        if (variant !== 1) branch(g, arm * 0.66, arm * 0.11);
        if (variant === 0 || variant === 4) {
          g.beginPath();
          g.arc(0, arm - 1, variant === 4 ? 2.6 : 1.8, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.beginPath();
      g.arc(0, 0, variant === 2 ? 3.4 : 2.3, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    if (variant < 2) arms(0, 0, "#f7fbff", 0.28, 8);
    arms(3, 4, "#0b2140", 0.5, 3.4);
    arms(0, 0, variant === 4 ? "#e7f2fb" : "#ffffff", 1, variant === 2 ? 2.7 : 1.8);
    return c;
  }

  function branch(g, y, len) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(len, y + len * 0.85);
    g.moveTo(0, y);
    g.lineTo(-len, y + len * 0.85);
    g.stroke();
  }

  function leafPath(g, shape) {
    g.beginPath();
    if (shape === "oak") {
      g.moveTo(0, -30);
      g.bezierCurveTo(16, -28, 22, -16, 14, -8);
      g.bezierCurveTo(24, -6, 26, 8, 12, 12);
      g.bezierCurveTo(16, 22, 6, 30, 0, 32);
      g.bezierCurveTo(-6, 30, -16, 22, -12, 12);
      g.bezierCurveTo(-26, 8, -24, -6, -14, -8);
      g.bezierCurveTo(-22, -16, -16, -28, 0, -30);
    } else if (shape === "birch") {
      g.moveTo(0, -34);
      g.bezierCurveTo(12, -28, 14, -8, 8, 16);
      g.bezierCurveTo(4, 30, 0, 36, 0, 36);
      g.bezierCurveTo(0, 36, -4, 30, -8, 16);
      g.bezierCurveTo(-14, -8, -12, -28, 0, -34);
    } else {
      g.moveTo(0, -32);
      g.bezierCurveTo(10, -30, 16, -18, 8, -12);
      g.bezierCurveTo(22, -16, 28, -2, 14, 4);
      g.bezierCurveTo(24, 12, 16, 22, 6, 14);
      g.bezierCurveTo(4, 26, 0, 30, 0, 30);
      g.bezierCurveTo(0, 30, -4, 26, -6, 14);
      g.bezierCurveTo(-16, 22, -24, 12, -14, 4);
      g.bezierCurveTo(-28, -2, -22, -16, -8, -12);
      g.bezierCurveTo(-16, -18, -10, -30, 0, -32);
    }
    g.closePath();
  }

  function paintLeaf(shape, color) {
    var c = makeCanvas(80, 96);
    var g = c.getContext("2d");
    g.translate(40, 46);
    leafPath(g, shape);
    var grad = g.createLinearGradient(0, -32, 8, 32);
    grad.addColorStop(0, shade(color, 48));
    grad.addColorStop(0.55, color);
    grad.addColorStop(1, shade(color, -30));
    g.fillStyle = grad;
    g.fill();
    g.strokeStyle = shade(color, -55);
    g.lineWidth = 1.15;
    g.beginPath();
    g.moveTo(0, 42);
    g.lineTo(0, -20);
    g.moveTo(0, 2);
    g.lineTo(11, -10);
    g.moveTo(0, 8);
    g.lineTo(-10, -2);
    g.moveTo(0, -6);
    g.lineTo(8, -16);
    g.stroke();
    return c;
  }

  function paintGlow(color) {
    var c = makeCanvas(48, 48);
    var g = c.getContext("2d");
    var grad = g.createRadialGradient(24, 24, 1, 24, 24, 22);
    grad.addColorStop(0, "#fffef6");
    grad.addColorStop(0.35, color);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(24, 24, 22, 0, Math.PI * 2);
    g.fill();
    return c;
  }

  function readFx() {
    var node = document.getElementById("season-fx-data");
    if (!node) return null;
    var all;
    try { all = JSON.parse(node.textContent); } catch (e) { return null; }
    var id = document.documentElement.getAttribute("data-season");
    if (!id || id === "default" || !all[id] || !all[id].fx) return null;
    return { id: id, fx: all[id].fx };
  }

  function stop() {
    if (!state) return;
    state.alive = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    document.removeEventListener("visibilitychange", state.onVis);
    window.removeEventListener("resize", state.onResize);
    state.nodes.forEach(function (node) { node.remove(); });
    state = null;
  }

  function start(forceHero) {
    stop();
    var spec = readFx();
    if (!spec) return;
    var fx = spec.fx;
    var kind = fx.kind;
    var header = document.querySelector(".top");
    var top = header ? Math.max(0, Math.round(header.getBoundingClientRect().bottom)) : 0;
    var width = window.innerWidth;
    var height = Math.max(0, window.innerHeight - top);
    if (height < 80) return;

    var phone = width < 700;
    var dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.25 : 1.5);
    var groundH = 128;
    var heroMs = Math.min(12000, Math.max(8000, fx.hero || 10000));
    var seen = false;
    try { seen = sessionStorage.getItem(SEEN) === spec.id; } catch (e) {}
    var hero = forceHero || !seen;
    try { sessionStorage.setItem(SEEN, spec.id); } catch (e) {}

    var nodes = [];
    var sky = makeCanvas(10, 10);
    sky.className = "season-fx";
    sky.setAttribute("aria-hidden", "true");
    sky.style.top = top + "px";
    sky.style.height = height + "px";
    document.body.appendChild(sky);
    nodes.push(sky);

    var ground = null;
    var gctx = null;
    if (kind === "snow" || kind === "spring") {
      ground = makeCanvas(10, 10);
      ground.className = "season-ground";
      ground.setAttribute("aria-hidden", "true");
      document.body.appendChild(ground);
      nodes.push(ground);
      gctx = ground.getContext("2d", { alpha: true });
    }

    var rays = null;
    if (kind === "summer") {
      rays = document.createElement("div");
      rays.className = hero ? "season-rays is-live" : "season-rays";
      rays.setAttribute("aria-hidden", "true");
      document.body.appendChild(rays);
      nodes.push(rays);
    }

    var ctx = sky.getContext("2d", { alpha: true });
    if (!ctx) { nodes.forEach(function (n) { n.remove(); }); return; }

    var flakes = [];
    var leaves = [];
    var glows = [];
    var colors = fx.colors && fx.colors.length ? fx.colors : ["#ffffff"];
    activeColors = colors;
    var i;
    if (kind === "snow") {
      for (i = 0; i < 5; i++) flakes.push(paintFlake(i));
    } else if (kind === "leaf") {
      var shapes = ["maple", "oak", "birch"];
      for (i = 0; i < colors.length; i++) {
        leaves.push(paintLeaf(shapes[i % 3], colors[i]));
      }
    } else if (kind === "summer") {
      for (i = 0; i < colors.length; i++) glows.push(paintGlow(colors[i]));
    }

    function sizeCanvases() {
      width = window.innerWidth;
      var head = document.querySelector(".top");
      top = head ? Math.max(0, Math.round(head.getBoundingClientRect().bottom)) : 0;
      height = Math.max(0, window.innerHeight - top);
      sky.style.top = top + "px";
      sky.style.height = height + "px";
      sky.width = Math.floor(width * dpr);
      sky.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (ground && gctx) {
        ground.width = Math.floor(width * dpr);
        ground.height = Math.floor(groundH * dpr);
        gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
    sizeCanvases();

    var cap = Math.min(60, fx.count || 20);
    if (phone) cap = kind === "snow" ? Math.min(cap, 36) : Math.min(cap, 16);
    var ambientCap = Math.min(12, fx.ambient || 5);
    if (phone) ambientCap = Math.max(3, Math.round(ambientCap * 0.7));
    var parts = [];
    for (i = 0; i < cap; i++) parts.push(spawn(i, true));

    var flowers = [];
    var grass = [];
    if (kind === "spring") {
      var types = ["daisy", "tulip", "dandelion", "daisy", "tulip", "dandelion", "daisy"];
      var nFlow = phone ? 5 : 7;
      for (i = 0; i < nFlow; i++) {
        flowers.push({
          x: ((i + 0.5) / nFlow) * width,
          type: types[i % types.length],
          delay: 0.08 + (i % 4) * 0.07,
          sway: 0.4 + Math.random(),
          phase: Math.random() * 6,
        });
      }
      var nGrass = phone ? 22 : 36;
      for (i = 0; i < nGrass; i++) {
        grass.push({
          x: Math.random() * width,
          h: 36 + Math.random() * 58,
          delay: Math.random() * 0.35,
          lean: (Math.random() - 0.5) * 16,
          phase: Math.random() * 6,
        });
      }
    }

    var bank = [];
    var snowGrad = null;

    function spawn(index, anywhere) {
      var depth = Math.random();
      return {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : -30 - Math.random() * 40,
        depth: depth,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * (kind === "leaf" ? 0.03 : 0.012),
        flip: Math.random() * Math.PI * 2,
        fv: 0.01 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2,
        sprite: kind === "snow"
          ? (depth < 0.34 ? index % 2 : 2 + (index % 3))
          : kind === "summer"
            ? index % colors.length
            : index % Math.max(1, leaves.length),
        color: colors[index % colors.length],
        wing: Math.random() * Math.PI * 2,
        kindBit: kind === "spring" ? (index % 6 === 0 ? "butterfly" : "petal") : (kind === "summer" && index % 3 === 0 ? "seed" : ""),
      };
    }

    state = {
      alive: true,
      raf: 0,
      nodes: nodes,
      onVis: function () { if (!document.hidden) wake(); },
      onResize: function () {
        if (!state || !state.alive) return;
        sizeCanvases();
        snowGrad = null;
      },
    };
    document.addEventListener("visibilitychange", state.onVis);
    window.addEventListener("resize", state.onResize);

    var t0 = performance.now();

    function wake() {
      if (state && state.alive && !state.raf && !document.hidden) {
        state.raf = requestAnimationFrame(frame);
      }
    }

    function frame(now) {
      if (!state || !state.alive) return;
      state.raf = 0;
      if (document.hidden) return;
      var elapsed = now - t0;
      var heroT = hero ? Math.min(1, elapsed / heroMs) : 1;
      var ambient = !hero || elapsed > heroMs;
      var fade = 1;
      if (hero && elapsed > heroMs) fade = Math.max(kind === "leaf" ? 0.55 : 0.8, 1 - (elapsed - heroMs) / 1600);
      var settle = 1;
      if (kind === "spring") {
        if (!hero) settle = 0.48;
        else if (elapsed > heroMs) settle = Math.max(0.48, 1 - ((elapsed - heroMs) / 1400) * 0.52);
      }
      ctx.clearRect(0, 0, width, height);
      var wind = Math.sin(now / 1700) * (kind === "snow" ? 0.45 : 0.25);
      var limit = ambient ? ambientCap : parts.length;
      var n = parts.length;
      var p;
      for (p = 0; p < n; p++) {
        var part = parts[p];
        if (ambient && p >= limit && kind !== "spring") continue;
        if (ambient && kind === "spring" && part.kindBit === "butterfly") continue;
        if (ambient && kind === "spring" && p >= limit) continue;
        step(part, wind, ambient);
        drawPart(part, fade, now);
      }
      if (kind === "snow") drawSnowBank(ambient || heroT > 0.28);
      if (kind === "spring" && gctx) drawSpring(Math.max(hero ? heroT : 1, ambient ? 1 : heroT), now, settle);
      if (kind === "summer" && rays && ambient && rays.classList.contains("is-live") && elapsed > heroMs + 200) {
        rays.classList.remove("is-live");
      }
      state.raf = requestAnimationFrame(frame);
    }

    function step(part, wind, ambient) {
      var speed = ambient ? 0.45 : 1;
      part.phase += 0.02;
      part.rot += part.vr;
      part.flip += part.fv;
      if (kind === "snow") {
        var z = 0.35 + part.depth * 0.9;
        part.y += (0.35 + z * 1.15) * speed;
        part.x += wind * z + Math.sin(part.phase) * 0.55;
        if (part.y > height - 6) {
          if (bank.length < 42) bank.push({ x: part.x, r: 1.4 + part.depth * 2.2 });
          part.y = -16;
          part.x = Math.random() * width;
        }
      } else if (kind === "leaf") {
        part.y += (0.45 + part.depth * 0.7) * speed;
        part.x += wind + Math.sin(part.phase) * 0.85;
        if (part.y > height + 30) {
          part.y = -30;
          part.x = Math.random() * width;
        }
      } else if (kind === "summer") {
        if (part.kindBit === "seed") {
          part.y -= 0.32 + part.depth * 0.22;
          part.x += wind * 0.35 + Math.sin(part.phase) * 0.4;
          if (part.y < -24) {
            part.y = height + 8;
            part.x = Math.random() * width;
          }
        } else {
          part.x += Math.sin(part.phase) * 0.22;
          part.y += Math.cos(part.phase * 0.8) * 0.16;
        }
      } else if (part.kindBit === "butterfly") {
        part.x += Math.sin(part.phase) * 0.6 + 0.25;
        part.y += Math.cos(part.phase * 0.7) * 0.35;
        part.wing += 0.18;
        if (part.x > width + 20) part.x = -20;
      } else {
        part.y += (0.4 + part.depth * 0.55) * speed;
        part.x += wind + Math.sin(part.phase) * 0.4;
        if (part.y > height + 16) {
          part.y = -16;
          part.x = Math.random() * width;
        }
      }
      if (part.x < -30) part.x = width + 10;
      if (part.x > width + 30) part.x = -10;
    }

    function drawPart(part, fade, now) {
      ctx.save();
      ctx.translate(part.x, part.y);
      if (kind === "snow") {
        var size = part.depth < 0.34 ? 14 + part.depth * 22 : part.depth < 0.7 ? 24 + part.depth * 18 : 36 + part.depth * 22;
        ctx.globalAlpha = (part.depth < 0.34 ? 0.62 : part.depth < 0.7 ? 0.82 : 0.96) * fade;
        ctx.rotate(part.rot);
        ctx.drawImage(flakes[part.sprite] || flakes[0], -size / 2, -size / 2, size, size);
      } else if (kind === "leaf") {
        var lw = 30 + part.depth * 28;
        var lh = lw * 1.2;
        ctx.globalAlpha = (0.75 + part.depth * 0.2) * fade;
        ctx.rotate(part.rot);
        ctx.scale(Math.cos(part.flip), 1);
        ctx.drawImage(leaves[part.sprite] || leaves[0], -lw / 2, -lh / 2, lw, lh);
      } else if (kind === "summer") {
        if (part.kindBit === "seed") {
          ctx.globalAlpha = 0.88 * fade;
          ctx.strokeStyle = "rgba(255,252,240,0.92)";
          ctx.lineWidth = 0.8;
          var k;
          for (k = 0; k < 7; k++) {
            var a = (k / 7) * Math.PI * 2 + part.rot;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 1.6, Math.sin(a) * 1.6);
            ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 14);
          ctx.stroke();
          ctx.fillStyle = activeColors[1] ? shade(activeColors[1], -70) : "#c47a16";
          ctx.beginPath();
          ctx.arc(0, 15, 1.7, 0, Math.PI * 2);
          ctx.fill();
        } else if (glows.length) {
          var pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(now / 280 + part.phase));
          ctx.globalAlpha = pulse * fade;
          var gs = 18 + part.depth * 26;
          var fire = glows[part.sprite % glows.length];
          ctx.drawImage(fire, -gs / 2, -gs / 2, gs, gs);
        }
      } else if (part.kindBit === "butterfly") {
        ctx.globalAlpha = 0.9 * fade;
        drawButterfly(ctx, part);
      } else {
        ctx.globalAlpha = 0.8 * fade;
        ctx.rotate(part.rot);
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.2, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawSnowBank(show) {
      if (!gctx) return;
      gctx.clearRect(0, 0, width, groundH);
      if (!show) return;
      if (!snowGrad) {
        snowGrad = gctx.createLinearGradient(0, groundH - 36, 0, groundH);
        snowGrad.addColorStop(0, "rgba(255,255,255,0)");
        snowGrad.addColorStop(1, "rgba(255,255,255,0.42)");
      }
      gctx.fillStyle = snowGrad;
      gctx.fillRect(0, groundH - 36, width, 36);
      var b;
      for (b = 0; b < bank.length; b++) {
        var flake = flakes[b % flakes.length];
        var r = bank[b].r * 3.2;
        gctx.globalAlpha = 0.8;
        gctx.drawImage(flake, bank[b].x - r, groundH - 8 - r - (b % 5) * 1.4, r * 2, r * 2);
      }
      gctx.globalAlpha = 1;
    }

    function drawSpring(progress, now, settle) {
      gctx.clearRect(0, 0, width, groundH);
      var sway = Math.sin(now / 700);
      gctx.lineCap = "round";
      var i;
      for (i = 0; i < grass.length; i++) {
        var blade = grass[i];
        var gt = Math.max(0, Math.min(1, (progress - blade.delay) / 0.4));
        if (gt <= 0) continue;
        var h = blade.h * gt * gt * settle;
        var lean = blade.lean + sway * 4;
        gctx.strokeStyle = gt > 0.5 ? (colors[3] || "#2f9a4e") : shade(colors[3] || "#2f9a4e", 28);
        gctx.lineWidth = 1.6;
        gctx.beginPath();
        gctx.moveTo(blade.x, groundH);
        gctx.quadraticCurveTo(blade.x + lean * 0.4, groundH - h * 0.55, blade.x + lean, groundH - h);
        gctx.stroke();
      }
      for (i = 0; i < flowers.length; i++) {
        var flower = flowers[i];
        var ft = Math.max(0, Math.min(1, (progress - 0.25 - flower.delay) / 0.35));
        if (ft <= 0) continue;
        var bob = Math.sin(now / 600 + flower.phase) * 2.2;
        drawFlower(gctx, flower.type, flower.x, groundH, ft * settle, bob);
      }
    }

    wake();
  }

  var activeColors = ["#f7d0ea", "#e6b8ec", "#ffffff", "#2f9a4e", "#922f78"];

  function drawButterfly(ctx, part) {
    var flap = 0.35 + Math.abs(Math.sin(part.wing)) * 0.75;
    ctx.fillStyle = activeColors[0];
    ctx.beginPath();
    ctx.ellipse(-6, 0, 7, 4.5 * flap, -0.4, 0, Math.PI * 2);
    ctx.ellipse(6, 0, 7, 4.5 * flap, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = activeColors[4];
    ctx.fillRect(-0.7, -5, 1.4, 10);
  }

  function drawFlower(ctx, type, x, base, scale, bob) {
    ctx.save();
    ctx.translate(x, base);
    ctx.scale(scale, scale);
    ctx.strokeStyle = activeColors[3];
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(6, -32, bob, -70);
    ctx.stroke();
    ctx.translate(bob, -70);
    if (type === "tulip") {
      ctx.fillStyle = activeColors[4];
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.bezierCurveTo(-10, 4, -8, -12, 0, -14);
      ctx.bezierCurveTo(8, -12, 10, 4, 0, 8);
      ctx.fill();
      ctx.fillStyle = activeColors[0];
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.bezierCurveTo(-4, 2, -3, -6, 0, -8);
      ctx.bezierCurveTo(3, -6, 4, 2, 0, 6);
      ctx.fill();
    } else if (type === "dandelion") {
      ctx.fillStyle = activeColors[1];
      var k;
      for (k = 0; k < 10; k++) {
        var a = (k / 10) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 7, Math.sin(a) * 7, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = activeColors[0];
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = activeColors[2];
      var p;
      for (p = 0; p < 8; p++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.ellipse(0, -8, 3.1, 6.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = activeColors[4];
      ctx.beginPath();
      ctx.arc(0, 0, 3.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  document.addEventListener("franconia-season", function () { start(false); });
  document.addEventListener("franconia-replay", function () { start(true); });
  if (document.body && document.body.classList.contains("home")) start(false);
})();
