/* Live Conditions map — reads /api/alerts (National Weather Service, summarized by state). */
(() => {
  "use strict";
  const NAMES = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
    DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
    IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
    MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
    NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
    NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
    RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
    VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  };
  // Map alert keywords to the most relevant Gear section.
  const GEAR_HINTS = [
    [/winter|blizzard|ice|freez|cold|frost|snow|wind chill/i, "heat", "Heat & CO safety gear"],
    [/hurricane|tropical|storm surge|flood|rain/i, "water", "Water storage & filtration"],
    [/heat/i, "power", "Power to run fans & cooling"],
    [/fire|red flag|smoke|air quality/i, "medical", "First aid & go-bag basics"],
    [/wind|tornado|thunderstorm/i, "light", "Light & power for outages"],
  ];

  const tiles = document.querySelectorAll(".tile-state");
  const status = document.querySelector("[data-live-status]");
  const detail = document.querySelector("[data-live-detail]");
  if (!tiles.length || !status || !detail) return;

  let data = null;
  let selected = null;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ago = (iso) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    return m < 1 ? "just now" : m === 1 ? "1 min ago" : `${m} min ago`;
  };
  const until = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d) ? "" : "Until " + d.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
  };

  function renderDetail(code) {
    selected = code;
    tiles.forEach((t) => t.classList.toggle("is-selected", t.dataset.state === code));
    const st = data?.states?.[code];
    const name = NAMES[code] || code;
    if (!st || !st.count) {
      detail.innerHTML = `<p class="label is-in"><span class="label__n">${esc(code)}</span><i class="label__rule"></i><span>${esc(name)}</span></p>
        <p class="live__clear"><i class="lv lv--Clear"></i>No active weather alerts right now.</p>
        <p class="live__hint">Quiet days are the best days to prepare.</p>
        <a class="live__cta" href="/#buy">Get the Blackout Kit →</a>`;
      return;
    }
    const allText = st.alerts.map((a) => a.event).join(" ");
    const hint = GEAR_HINTS.find(([re]) => re.test(allText));
    const items = st.alerts.map((a) => `
      <li class="alert alert--${esc(a.severity)}">
        <div class="alert__top"><span class="alert__sev">${esc(a.severity)}</span><span class="alert__until">${esc(until(a.ends))}</span></div>
        <h4>${esc(a.event)}</h4>
        <p>${esc(a.areas)}</p>
      </li>`).join("");
    detail.innerHTML = `<p class="label is-in"><span class="label__n">${esc(code)}</span><i class="label__rule"></i><span>${esc(name)}</span></p>
      <p class="live__count"><i class="lv lv--${esc(st.level)}"></i>${st.count} active alert${st.count === 1 ? "" : "s"} · highest: ${esc(st.level)}</p>
      <ul class="alerts">${items}</ul>
      ${st.count > st.alerts.length ? `<p class="live__hint">Showing the ${st.alerts.length} most severe.</p>` : ""}
      ${hint ? `<a class="live__cta" href="/gear#${hint[1]}">Prepare: ${esc(hint[2])} →</a>` : ""}
      <a class="live__cta live__cta--ghost" href="/#buy">Get the Blackout Kit →</a>`;
  }

  function paint() {
    tiles.forEach((t) => {
      const st = data.states[t.dataset.state];
      const level = st && st.count ? st.level : "Clear";
      t.dataset.level = level;
      t.setAttribute("aria-label", `${NAMES[t.dataset.state] || t.dataset.state}: ${st && st.count ? `${st.count} alerts, highest ${level}` : "no alerts"}`);
    });
    status.innerHTML = `<span class="dot dot--teal"></span>${data.statesWithAlerts} state${data.statesWithAlerts === 1 ? "" : "s"} with active alerts · updated ${esc(ago(data.updated))}`;
    if (selected) renderDetail(selected);
  }

  async function load() {
    try {
      const res = await fetch("/api/alerts", { headers: { Accept: "application/json" } });
      const body = await res.json();
      if (!res.ok || !body.states) throw new Error(body.error || "Unavailable");
      data = body;
      paint();
      if (!selected) {
        // Open the most severe state by default.
        const rank = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };
        const top = Object.entries(data.states).filter(([, s]) => s.count)
          .sort((a, b) => rank[b[1].level] - rank[a[1].level] || b[1].count - a[1].count)[0];
        if (top) renderDetail(top[0]);
      }
    } catch {
      status.innerHTML = `<span class="dot dot--orange"></span>Live alerts are temporarily unavailable. Try again in a few minutes.`;
    }
  }

  tiles.forEach((t) => t.addEventListener("click", () => renderDetail(t.dataset.state)));
  load();
  setInterval(load, 5 * 60 * 1000);
})();
