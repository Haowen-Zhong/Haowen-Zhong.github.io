// Haowen Zhong — personal site
document.documentElement.classList.add("js");

// ── Nav: background once scrolled, highlight current section ──
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const links = [...document.querySelectorAll(".nav nav a")];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
document.querySelectorAll("main .section").forEach((s) => sectionObserver.observe(s));

// ── Fade sections in as they scroll into view ──
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

document.getElementById("year").textContent = new Date().getFullYear();

// ── Hero: a compact-binary inspiral–merger–ringdown "chirp" ──
// Leading-order inspiral: f(τ) ∝ τ^(-3/8), amplitude ∝ f^(2/3), with τ = t_c − t.
// After merger, a damped sinusoid stands in for the ringdown.
(function chirp() {
  const canvas = document.getElementById("chirp");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, wave = [];

  function strain(x) {
    // x ∈ [0,1]; merger at x = 0.8
    const tc = 0.8;
    if (x < tc) {
      const tau = Math.max(tc - x, 0.004);
      const phase = -2 * Math.PI * 9 * Math.pow(tau, 5 / 8) * 3.2;
      const amp = Math.min(Math.pow(tau / tc, -1 / 4) * 0.18, 1);
      return amp * Math.cos(phase);
    }
    const dt = x - tc;
    const tau0 = 0.004;
    const phase0 = -2 * Math.PI * 9 * Math.pow(tau0, 5 / 8) * 3.2;
    const ampM = Math.min(Math.pow(tau0 / tc, -1 / 4) * 0.18, 1);
    return ampM * Math.exp(-dt / 0.025) * Math.cos(phase0 + 2 * Math.PI * 70 * dt);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(600, Math.floor(W * 1.5));
    wave = Array.from({ length: n + 1 }, (_, i) => strain(i / n));
  }

  function draw(progress) {
    ctx.clearRect(0, 0, W, H);
    const mid = H / 2, A = H * 0.42, n = wave.length - 1;
    const upto = Math.floor(n * Math.min(progress, 1));

    // faint full template
    ctx.beginPath();
    for (let i = 0; i <= n; i++) ctx.lineTo((i / n) * W, mid - wave[i] * A);
    ctx.strokeStyle = "rgba(120,160,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // "observed" signal
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "rgba(90,169,255,0)");
    g.addColorStop(0.45, "rgba(90,169,255,0.75)");
    g.addColorStop(0.78, "rgba(245,194,107,1)");
    g.addColorStop(1, "rgba(255,157,77,0.6)");
    ctx.beginPath();
    for (let i = 0; i <= upto; i++) ctx.lineTo((i / n) * W, mid - wave[i] * A);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = "rgba(245,194,107,0.55)";
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // detector "cursor"
    if (progress < 1) {
      const x = (upto / n) * W, y = mid - wave[upto] * A;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#f5c26b";
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  resize();
  window.addEventListener("resize", () => { resize(); if (reduce) draw(1); });

  if (reduce) { draw(1); return; }

  const DURATION = 5200, HOLD = 2200;
  let start = null;
  function frame(t) {
    if (start === null) start = t;
    const el = t - start;
    draw(el / DURATION);
    if (el > DURATION + HOLD) start = t;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
