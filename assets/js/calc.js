/* Readiness Calculator — instant household estimates + readiness score. No data leaves the page. */
(() => {
  "use strict";
  const root = document.querySelector("[data-calc]");
  if (!root) return;

  const LIMITS = { adults: [1, 12], kids: [0, 12], pets: [0, 8] };
  const state = { adults: 2, kids: 0, pets: 0, days: 14, home: "apt", med: false };
  const out = (k) => root.querySelector(`[data-out="${k}"]`);
  const fmt = (n) => Math.round(n).toLocaleString();

  function compute() {
    const people = state.adults + state.kids;
    const water = Math.ceil(people * 1 * state.days + state.pets * 0.25 * state.days); // CDC: 1 gal/person/day; ~1 qt/pet/day
    const lanterns = state.home === "house" ? 2 : 1;
    out("water").textContent = fmt(water);
    out("waterlb").textContent = `≈ ${fmt(water * 8.34)} lb`;
    out("meals").textContent = fmt(people * 3 * state.days);
    out("light").textContent = fmt(people + lanterns);
    out("lightd").textContent = `${people} headlamp${people === 1 ? "" : "s"} + ${lanterns} lantern${lanterns === 1 ? "" : "s"}`;
    out("bags").textContent = fmt(people * state.days);
    const banks = `${people} phone power bank${people === 1 ? "" : "s"}`;
    out("power").textContent = state.med
      ? `Power: ${banks}, plus a portable power station sized for the medical equipment. Ask your provider about runtime and backup.`
      : state.days >= 14
        ? `Power: ${banks}, plus a portable power station for a multi-week outage.`
        : `Power: ${banks} and spare batteries.`;
  }

  function score() {
    const checks = root.querySelectorAll("[data-chk]");
    const n = [...checks].filter((c) => c.checked).length;
    const pct = Math.round((n / checks.length) * 100);
    const box = root.querySelector(".score");
    const label = pct >= 80 ? "Ready" : pct >= 40 ? "Partially ready" : "Exposed";
    box.dataset.score = pct >= 80 ? "ready" : pct >= 40 ? "partial" : "exposed";
    box.querySelector("i").style.setProperty("--p", pct);
    out("score").textContent = `${pct}/100`;
    out("scorelbl").textContent = label;
  }

  root.querySelectorAll("[data-step]").forEach((el) => {
    const key = el.dataset.step;
    const [min, max] = LIMITS[key];
    const [dec, inc] = el.querySelectorAll("button");
    const o = el.querySelector("output");
    const sync = () => { o.textContent = state[key]; dec.disabled = state[key] <= min; inc.disabled = state[key] >= max; compute(); };
    dec.addEventListener("click", () => { state[key] = Math.max(min, state[key] - 1); sync(); });
    inc.addEventListener("click", () => { state[key] = Math.min(max, state[key] + 1); sync(); });
    sync();
  });

  root.querySelectorAll("[data-seg]").forEach((el) => {
    const key = el.dataset.seg;
    el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      el.querySelectorAll("button").forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-checked", String(x === b)); });
      state[key] = key === "days" ? Number(b.dataset.v) : b.dataset.v;
      compute();
    }));
  });

  root.querySelector("[data-med]").addEventListener("change", (e) => { state.med = e.target.checked; compute(); });
  root.querySelectorAll("[data-chk]").forEach((c) => c.addEventListener("change", score));
  compute();
  score();
})();
