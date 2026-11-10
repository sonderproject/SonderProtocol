// GET /api/alerts → active National Weather Service alerts, summarized by state.
// Free, official data (api.weather.gov). Cached at the edge for 5 minutes.
const NWS_URL = "https://api.weather.gov/alerts/active?status=actual";
const USER_AGENT = "SonderProtocol/1.0 (sonderprotocol.vercel.app)";
const MAX_PER_STATE = 25;

export const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD",
  "TN","TX","UT","VT","VA","WA","WV","WI","WY",
];
const STATE_SET = new Set(STATES);
export const SEVERITY_RANK = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };

// Pure function so it can be tested without network access.
export function summarize(geojson) {
  const states = {};
  for (const code of STATES) states[code] = { level: "Clear", rank: -1, count: 0, alerts: [] };

  for (const feature of geojson?.features ?? []) {
    const p = feature?.properties;
    if (!p) continue;
    const ugc = p.geocode?.UGC ?? [];
    const touched = new Set(ugc.map((c) => String(c).slice(0, 2)).filter((s) => STATE_SET.has(s)));
    if (!touched.size) continue; // marine zones and territories
    const severity = SEVERITY_RANK[p.severity] !== undefined ? p.severity : "Unknown";
    const alert = {
      id: p.id || feature.id,
      event: p.event || "Alert",
      severity,
      headline: p.headline || "",
      areas: (p.areaDesc || "").slice(0, 220),
      ends: p.ends || p.expires || null,
    };
    for (const s of touched) {
      const st = states[s];
      st.count += 1;
      const r = SEVERITY_RANK[severity];
      if (r > st.rank) { st.rank = r; st.level = severity; }
      st.alerts.push(alert);
    }
  }

  let active = 0;
  for (const st of Object.values(states)) {
    st.alerts.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
    st.alerts = st.alerts.slice(0, MAX_PER_STATE);
    if (st.count) active += 1;
    delete st.rank;
  }
  return { updated: new Date().toISOString(), source: "National Weather Service (api.weather.gov)", statesWithAlerts: active, states };
}

export async function GET() {
  try {
    const res = await fetch(NWS_URL, { headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" } });
    if (!res.ok) throw new Error(`NWS responded ${res.status}`);
    const body = summarize(await res.json());
    return Response.json(body, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (err) {
    console.error("alerts_error", err?.message);
    return Response.json(
      { error: "Live alerts are temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "public, s-maxage=60" } },
    );
  }
}
