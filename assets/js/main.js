/* Sonder Protocol — site interactions. No dependencies. */
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

  // --- Checkout error notice (set by /api/checkout on failure) ---
  const checkoutMsg = document.querySelector("[data-checkout-msg]");
  if (checkoutMsg && new URLSearchParams(location.search).get("checkout") === "error") {
    checkoutMsg.textContent = "CHECKOUT UNAVAILABLE. PLEASE TRY AGAIN IN A MOMENT.";
    checkoutMsg.classList.add("t-red");
  }
})();
