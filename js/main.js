/* ===========================================================
   PDM 4Cero — interacciones
   =========================================================== */

/* ---------- Menú móvil ---------- */
(function () {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }
})();

/* ---------- Hero: nube de puntos / barrido LiDAR ---------- */
(function () {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  let w, h, dpr, points = [], raf;

  const COLORS = ["#28e0b0", "#4ea8ff", "#1ba888"];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  // Genera puntos sobre una superficie ondulada proyectada (sugiere escaneo de terreno)
  function build() {
    points = [];
    const cols = w < 700 ? 40 : 64;
    const rows = w < 700 ? 26 : 38;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const nx = i / cols;
        const ny = j / rows;
        // perspectiva: comprime verticalmente arriba
        const depth = 0.35 + ny * 0.9;
        const px = (nx - 0.5) * w * 1.25 * depth + w * 0.62;
        const py = h * 0.18 + ny * h * 0.82;
        points.push({
          bx: px, by: py,
          x: px, y: py,
          phase: nx * 6 + ny * 4,
          amp: 14 * depth,
          size: (0.7 + depth) * (Math.random() * 0.6 + 0.7),
          c: COLORS[(i + j) % 3],
          a: 0.18 + depth * 0.5
        });
      }
    }
  }

  let t = 0;
  let scan = -0.2;
  function frame() {
    ctx.clearRect(0, 0, w, h);
    t += 0.012;
    scan += 0.0035;
    if (scan > 1.25) scan = -0.25;
    const scanY = h * 0.18 + scan * h * 0.82;

    for (const p of points) {
      const wave = Math.sin(t + p.phase) * p.amp;
      p.x = p.bx;
      p.y = p.by + wave;

      // realce cuando el barrido pasa cerca
      const d = Math.abs(p.y - scanY);
      const lit = d < 36 ? (1 - d / 36) : 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size + lit * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = Math.min(1, p.a + lit * 0.6);
      ctx.fill();
    }

    // línea de barrido
    ctx.globalAlpha = 0.5;
    const grad = ctx.createLinearGradient(0, scanY, w, scanY);
    grad.addColorStop(0, "rgba(40,224,176,0)");
    grad.addColorStop(0.5, "rgba(40,224,176,0.55)");
    grad.addColorStop(1, "rgba(40,224,176,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(w, scanY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("resize", () => { cancelAnimationFrame(raf); resize(); frame(); });
  resize();
  frame();
})();

/* ---------- Contador KPIs ---------- */
(function () {
  const els = document.querySelectorAll("[data-count]");
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      let cur = 0;
      const step = target / 40;
      const tick = () => {
        cur += step;
        if (cur >= target) { el.textContent = target + suffix; return; }
        el.textContent = Math.floor(cur) + suffix;
        requestAnimationFrame(tick);
      };
      tick();
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  els.forEach(el => obs.observe(el));
})();

/* ---------- Reveal al hacer scroll ---------- */
(function () {
  const els = document.querySelectorAll("[data-reveal]");
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = 1;
        e.target.style.transform = "none";
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => {
    el.style.opacity = 0;
    el.style.transform = "translateY(18px)";
    el.style.transition = "opacity .6s ease, transform .6s ease";
    obs.observe(el);
  });
})();

/* ---------- Formulario de contacto ---------- */
(function () {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const status = form.querySelector(".form-status");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = form.nombre.value.trim();
    const correo = form.correo.value.trim();
    if (!nombre || !correo) {
      status.style.color = "#ff6b6b";
      status.textContent = "Completa nombre y correo para continuar.";
      return;
    }
    // Compone un mensaje y abre el cliente de correo / WhatsApp
    const servicio = form.servicio.value;
    const msg = form.mensaje.value.trim();
    const cuerpo = encodeURIComponent(
      `Nombre: ${nombre}\nCorreo: ${correo}\nOrganización: ${form.organizacion.value}\nServicio de interés: ${servicio}\n\n${msg}`
    );
    status.style.color = "var(--scan)";
    status.textContent = "Abriendo tu cliente de correo…";
    window.location.href = `mailto:ventas@pdm4cero.com.mx?subject=${encodeURIComponent("Solicitud de cotización — " + servicio)}&body=${cuerpo}`;
    form.reset();
  });
})();

/* ---------- Año dinámico ---------- */
document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
