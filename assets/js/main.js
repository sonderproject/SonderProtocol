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
    const lenis = new window.Lenis({ lerp: 0.16, smoothWheel: true, wheelMultiplier: 1.15 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      const target = id === "#top" ? 0 : (id.length > 1 && document.querySelector(id));
      if (target === null || target === false) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -72, duration: 0.8 });
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
        el.style.transitionDelay = Math.min(siblings.indexOf(el), 4) * 40 + "ms";
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
  if (saleEls.length || document.querySelector("[data-price]")) {
    const pad = (n) => String(n).padStart(2, "0");
    const tickSale = () => {
      const ms = SALE_END - Date.now();
      if (ms <= 0) {
        saleEls.forEach((el) => (el.hidden = true));
        document.querySelectorAll("[data-was]").forEach((el) => (el.hidden = true));
        document.querySelectorAll("[data-price]").forEach((el) => (el.textContent = el.textContent.replace("$20", "$27")));
        return false;
      }
      const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
      const text = d > 0 ? `${d}d ${pad(h)}h ${pad(m)}m` : `${pad(h)}:${pad(m)}:${pad(s)}`;
      countdowns.forEach((el) => (el.textContent = text));
      return true;
    };
    if (tickSale()) { const t = setInterval(() => { if (!tickSale()) clearInterval(t); }, 1000); }
  }

  // --- Shared live data request (status strip, tools card, local alert banner) ---
  const getJSON = (u) => fetch(u, { headers: { Accept: "application/json" } }).then((r) => (r.ok ? r.json() : Promise.reject()));
  let alertsCache;
  const alertsReq = { then: (...a) => (alertsCache ||= getJSON("/api/alerts")).then(...a) };

  // --- Local alert banner: "Winter Storm Warning in Texas right now" (homepage hero) ---
  const localAlert = document.querySelector("[data-local-alert]");
  if (localAlert) {
    const NAMES = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "D.C.", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming" };
    getJSON("/api/where").then(({ region }) => {
      if (!NAMES[region]) return;
      let al = null, ou = null;
      const render = () => {
        const st = al?.states?.[region];
        const out = ou?.states?.[region]?.customers || 0;
        const outTxt = out >= 100 ? `${out.toLocaleString()} customers without power` : "";
        let text = "";
        if (st?.count && st.alerts?.[0]) text = `${st.alerts[0].event} in ${NAMES[region]} right now${outTxt ? " · " + outTxt : ""}`;
        else if (outTxt) text = `${outTxt} in ${NAMES[region]} right now`;
        if (!text) return;
        localAlert.querySelector("[data-local-alert-text]").textContent = text;
        localAlert.hidden = false;
      };
      alertsReq.then((d) => { al = d; render(); }, () => {});
      getJSON("/api/outages").then((d) => { ou = d; render(); }, () => {});
    }).catch(() => {});
  }

  // --- Live alert summary (status strip, Free Tools card, Right Now panel) ---
  const liveCount = document.querySelectorAll("[data-live-count]");
  const liveTop = document.querySelectorAll("[data-live-top]");
  const liveStrip = document.querySelector("[data-live-strip]");
  if (liveCount.length || liveTop.length || liveStrip) {
    const RANK = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    alertsReq
      .then((d) => {
        const n = d.statesWithAlerts || 0;
        liveCount.forEach((el) => (el.textContent = n));
        if (liveStrip) liveStrip.innerHTML = n ? `ALERTS ACTIVE IN <strong class="t-orange">${n}</strong> STATES` : "NO MAJOR ALERTS · LIVE MAP";
        // Most severe event types, grouped by event with the states that have them.
        const byEvent = new Map();
        for (const [code, st] of Object.entries(d.states || {})) {
          for (const a of st.alerts || []) {
            const e = byEvent.get(a.event) || { event: a.event, sev: a.severity, states: new Set() };
            e.states.add(code);
            if (RANK[a.severity] > RANK[e.sev]) e.sev = a.severity;
            byEvent.set(a.event, e);
          }
        }
        const top = [...byEvent.values()].sort((a, b) => RANK[b.sev] - RANK[a.sev] || b.states.size - a.states.size).slice(0, 3);
        const html = top.length
          ? top.map((e) => `<li><i class="lv lv--${esc(e.sev)}"></i><span>${esc(e.event)}</span><em>${esc([...e.states].slice(0, 4).join(", "))}${e.states.size > 4 ? " +" + (e.states.size - 4) : ""}</em></li>`).join("")
          : "<li><i class=\"lv lv--Clear\"></i><span>No major alerts right now. The best time to prepare.</span></li>";
        liveTop.forEach((el) => (el.innerHTML = html));
      })
      .catch(() => {
        liveCount.forEach((el) => (el.textContent = "Live"));
        liveTop.forEach((el) => (el.innerHTML = "<li><span>Open the map for current alerts.</span></li>"));
      });
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
