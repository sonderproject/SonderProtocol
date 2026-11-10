/* Sonder Protocol — site interactions. Optional dependency: Lenis (smooth scroll, desktop only). */
(() => {
  "use strict";

  // --- UTC clock in status bar ---
  const clock = document.querySelector("[data-clock]");
  if (clock) {
    const tick = () => {
      clock.textContent = "UTC " + new Date().toISOString().slice(11, 19);
    };
    tick();
    setInterval(tick, 1000);
  }

  // --- Smooth scroll (Lenis) on desktop pointers only; native scroll on touch ---
  const fine = window.matchMedia("(pointer: fine)").matches;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (fine && !calm && typeof window.Lenis === "function") {
    const lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      const target = id === "#top" ? 0 : (id.length > 1 && document.querySelector(id));
      if (target === null || target === false) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -72, duration: 1.4 });
    });
  }

  // --- Footer year ---
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  // --- Nav: scrolled state + mobile toggle ---
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  if (nav && toggle) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    nav.querySelectorAll(".nav__links a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  // --- Reveal on scroll (staggered within each parent) ---
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
        el.style.transitionDelay = Math.min(siblings.indexOf(el), 6) * 70 + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  // --- Sale countdown (fixed deadline; hides sale notices once it passes) ---
  const SALE_END = new Date("2026-11-30T23:59:59-08:00");
  const saleEls = document.querySelectorAll("[data-sale]");
  const countdowns = document.querySelectorAll("[data-sale-countdown]");
  if (saleEls.length) {
    const pad = (n) => String(n).padStart(2, "0");
    const tickSale = () => {
      const ms = SALE_END - Date.now();
      if (ms <= 0) { saleEls.forEach((el) => (el.hidden = true)); return false; }
      const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
      const text = d > 0 ? `${d}d ${pad(h)}h ${pad(m)}m` : `${pad(h)}:${pad(m)}:${pad(s)}`;
      countdowns.forEach((el) => (el.textContent = text));
      return true;
    };
    if (tickSale()) { const t = setInterval(() => { if (!tickSale()) clearInterval(t); }, 1000); }
  }

  // --- Sticky buy bar: show after the hero, hide at the final CTA ---
  const buybar = document.querySelector("[data-buybar]");
  const hero = document.querySelector("[data-hero]");
  const finalCta = document.getElementById("buy");
  if (buybar && hero && finalCta && "IntersectionObserver" in window) {
    const seen = { hero: true, cta: false };
    const update = () => {
      const show = !seen.hero && !seen.cta;
      buybar.classList.toggle("is-visible", show);
      buybar.setAttribute("aria-hidden", String(!show));
      buybar.querySelector("button").tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(([e]) => { seen.hero = e.isIntersecting; update(); }).observe(hero);
    new IntersectionObserver(([e]) => { seen.cta = e.isIntersecting; update(); }).observe(finalCta);
  }

  // --- Checkout error notice (set by /api/checkout on failure) ---
  const checkoutMsg = document.querySelector("[data-checkout-msg]");
  if (checkoutMsg && new URLSearchParams(location.search).get("checkout") === "error") {
    checkoutMsg.textContent = "CHECKOUT UNAVAILABLE. PLEASE TRY AGAIN IN A MOMENT.";
    checkoutMsg.classList.add("t-red");
  }
})();
