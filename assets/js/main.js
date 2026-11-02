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

  // --- Email signup ---
  // Set data-endpoint on the form to a POST URL (Formspree, ConvertKit, Beehiiv, etc.).
  // With no endpoint, the form runs in demo mode and stores nothing.
  const form = document.querySelector("[data-signup]");
  const msg = document.querySelector("[data-signup-msg]");
  if (form && msg) {
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    const setMsg = (text, state) => {
      msg.textContent = text;
      msg.classList.remove("is-ok", "is-err");
      if (state) msg.classList.add(state);
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      form.classList.remove("is-error");
      if (form.company && form.company.value) return; // honeypot

      const email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        form.classList.add("is-error");
        setMsg("ENTER A VALID EMAIL ADDRESS.", "is-err");
        input.focus();
        return;
      }

      const endpoint = form.dataset.endpoint;
      button.disabled = true;
      const label = button.textContent;
      button.textContent = "Transmitting…";

      try {
        if (endpoint) {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ email, source: "sonderprotocol.com/home" }),
          });
          if (!res.ok) throw new Error("Request failed");
        }
        form.reset();
        setMsg("CONFIRMED. YOU'RE ON THE READINESS LIST.", "is-ok");
      } catch {
        setMsg("TRANSMISSION FAILED. PLEASE TRY AGAIN.", "is-err");
      } finally {
        button.disabled = false;
        button.textContent = label;
      }
    });
  }
})();
