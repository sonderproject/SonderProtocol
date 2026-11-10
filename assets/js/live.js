/* Live map — two layers: NWS weather alerts (/api/alerts) and DOE ODIN power outages (/api/outages). */
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
  const RANK = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0, Clear: -1 };
  const GEAR_HINTS = [
    [/winter|blizzard|ice|freez|cold|frost|snow|wind chill/i, "heat", "Heat & CO safety gear"],
    [/hurricane|tropical|storm surge|flood|rain/i, "water", "Water storage & filtration"],
    [/heat/i, "power", "Power to run fans & cooling"],
    [/fire|red flag|smoke|air quality/i, "medical", "First aid & go-bag basics"],
    [/wind|tornado|thunderstorm/i, "light", "Light & power for outages"],
  ];
  const LAYERS = {
    alerts: {
      url: "/api/alerts",
      legend: [["Extreme", "Extreme"], ["Severe", "Severe"], ["Moderate", "Moderate"], ["Minor", "Minor"], ["Clear", "No alerts"]],
      note: "Source: National Weather Service (api.weather.gov), refreshed every 5 minutes. For emergencies, follow local officials and call 911.",
    },
    outages: {
      url: "/api/outages",
      legend: [["Extreme", "10,000+ out"], ["Severe", "1,000+"], ["Moderate", "100+"], ["Minor", "1–99"], ["NoData", "No reports"]],
      note: "Source: U.S. Department of Energy ODIN, refreshed every 5 minutes. Only participating utilities report, so many states show no data. Gray means no reports, not necessarily no outages. Check your utility's outage map for your address.",
    },
  };

  const tiles = document.querySelectorAll(".tile-state");
  const status = document.querySelector("[data-live-status]");
  const detail = document.querySelector("[data-live-detail]");
  const legend = document.querySelector("[data-live-legend]");
  const note = document.querySelector("[data-live-note]");
  const modeBtns = document.querySelectorAll("[data-mode]");
  if (!tiles.length || !status || !detail) return;

  const data = { alerts: null, outages: null };
  const failed = { alerts: false, outages: false };
  let mode = new URLSearchParams(location.search).get("layer") === "outages" ? "outages" : "alerts";
  let selected = null;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (n) => Number(n || 0).toLocaleString();
  const ago = (iso) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    return m < 1 ? "just now" : m === 1 ? "1 min ago" : `${m} min ago`;
  };
  const when = (iso, prefix) => {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d) ? "" : prefix + d.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
  };
  const head = (code) => `<p class="label is-in"><span class="label__n">${esc(code)}</span><i class="label__rule"></i><span>${esc(NAMES[code] || code)}</span></p>`;

  function detailAlerts(code) {
    const st = data.alerts?.states?.[code];
    if (!st || !st.count) {
      return `${head(code)}<p class="live__clear"><i class="lv lv--Clear"></i>No active weather alerts right now.</p>
        <p class="live__hint">Quiet days are the best days to prepare.</p><a class="live__cta" href="/#buy">Get the Blackout Kit →</a>`;
    }
    const hint = GEAR_HINTS.find(([re]) => re.test(st.alerts.map((a) => a.event).join(" ")));
    const items = st.alerts.map((a) => `
      <li class="alert alert--${esc(a.severity)}">
        <div class="alert__top"><span class="alert__sev">${esc(a.severity)}</span><span class="alert__until">${esc(when(a.ends, "Until "))}</span></div>
        <h4>${esc(a.event)}</h4><p>${esc(a.areas)}</p>
      </li>`).join("");
    return `${head(code)}<p class="live__count"><i class="lv lv--${esc(st.level)}"></i>${st.count} active alert${st.count === 1 ? "" : "s"} · highest: ${esc(st.level)}</p>
      <ul class="alerts">${items}</ul>
      ${st.count > st.alerts.length ? `<p class="live__hint">Showing the ${st.alerts.length} most severe.</p>` : ""}
      ${hint ? `<a class="live__cta" href="/gear#${hint[1]}">Prepare: ${esc(hint[2])} →</a>` : ""}
      <a class="live__cta live__cta--ghost" href="/#buy">Get the Blackout Kit →</a>`;
  }

  function detailOutages(code) {
    const st = data.outages?.states?.[code];
    if (!st) {
      return `${head(code)}<p class="live__clear"><i class="lv lv--NoData"></i>No outages reported here.</p>
        <p class="live__hint">Many utilities don't report to this feed. Check your local utility's outage map for your address.</p>
        <a class="live__cta" href="/#buy">Be ready before it happens →</a>`;
    }
    const counties = st.counties.map((c) => `<li><span>${esc(c.name)} County</span><em>${num(c.customers)}</em></li>`).join("");
    return `${head(code)}
      <p class="live__big"><strong>${num(st.customers)}</strong> customers without power</p>
      <p class="live__count"><i class="lv lv--${esc(st.level)}"></i>${st.incidents} reported outage${st.incidents === 1 ? "" : "s"}${st.latestRestore ? " · " + esc(when(st.latestRestore, "Est. restore by ")) : ""}</p>
      ${counties ? `<p class="now__eyebrow live__sub">Most affected counties</p><ul class="now__list">${counties}</ul>` : ""}
      ${st.utilities.length ? `<p class="live__hint">Reported by: ${esc(st.utilities.join(", "))}</p>` : ""}
      <a class="live__cta" href="/gear#power">Prepare: Power &amp; light →</a>
      <a class="live__cta live__cta--ghost" href="/#buy">Get the Blackout Kit →</a>`;
  }

  function renderDetail(code) {
    selected = code;
    tiles.forEach((t) => t.classList.toggle("is-selected", t.dataset.state === code));
    if (!data[mode]) return;
    detail.innerHTML = mode === "alerts" ? detailAlerts(code) : detailOutages(code);
  }

  function paint() {
    const layer = LAYERS[mode];
    legend.innerHTML = layer.legend.map(([lv, label]) => `<li><i class="lv lv--${lv}"></i>${label}</li>`).join("");
    if (note) note.textContent = layer.note;
    const d = data[mode];
    if (!d) {
      status.innerHTML = failed[mode]
        ? `<span class="dot dot--orange"></span>${mode === "alerts" ? "Weather alerts" : "Outage data"} temporarily unavailable. Try again in a few minutes.`
        : `<span class="dot dot--orange pulse"></span>Loading live data…`;
      tiles.forEach((t) => (t.dataset.level = ""));
      return;
    }
    tiles.forEach((t) => {
      const code = t.dataset.state;
      const name = NAMES[code] || code;
      if (mode === "alerts") {
        const st = d.states[code];
        const level = st && st.count ? st.level : "Clear";
        t.dataset.level = level;
        t.setAttribute("aria-label", `${name}: ${st && st.count ? `${st.count} alerts, highest ${level}` : "no alerts"}`);
      } else {
        const st = d.states[code];
        t.dataset.level = st ? (st.customers > 0 ? st.level : "Clear") : "NoData";
        t.setAttribute("aria-label", `${name}: ${st ? `${num(st.customers)} customers out` : "no outage reports"}`);
      }
    });
    status.innerHTML = mode === "alerts"
      ? `<span class="dot dot--teal"></span>${d.statesWithAlerts} state${d.statesWithAlerts === 1 ? "" : "s"} with active alerts · updated ${esc(ago(d.updated))}`
      : `<span class="dot dot--teal"></span><strong>${num(d.customersOut)}</strong>&nbsp;customers out across ${d.statesReporting} reporting state${d.statesReporting === 1 ? "" : "s"} · updated ${esc(ago(d.updated))}`;
    const pick = selected || topState();
    if (pick) renderDetail(pick);
  }

  function topState() {
    const d = data[mode];
    if (!d) return null;
    const entries = Object.entries(d.states).filter(([, s]) => (mode === "alerts" ? s.count : s.customers));
    entries.sort((a, b) => mode === "alerts"
      ? RANK[b[1].level] - RANK[a[1].level] || b[1].count - a[1].count
      : b[1].customers - a[1].customers);
    return entries[0]?.[0] || null;
  }

  async function load(which) {
    try {
      const res = await fetch(LAYERS[which].url, { headers: { Accept: "application/json" } });
      const body = await res.json();
      if (!res.ok || !body.states) throw new Error(body.error || "Unavailable");
      data[which] = body;
      failed[which] = false;
    } catch {
      failed[which] = true;
    }
    if (which === mode) paint();
  }

  function setMode(next) {
    mode = next;
    selected = null;
    modeBtns.forEach((b) => { const on = b.dataset.mode === mode; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", String(on)); });
    document.documentElement.dataset.layer = mode;
    const url = new URL(location.href);
    if (mode === "outages") url.searchParams.set("layer", "outages"); else url.searchParams.delete("layer");
    history.replaceState(null, "", url);
    paint();
  }

  tiles.forEach((t) => t.addEventListener("click", () => renderDetail(t.dataset.state)));
  modeBtns.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  setMode(mode);
  load("alerts");
  load("outages");
  setInterval(() => { load("alerts"); load("outages"); }, 5 * 60 * 1000);
})();
