// GET /api/outages → current power outages reported to the DOE's ODIN program, summarized by state.
// Free, public, no key (openenergyhub.ornl.gov). Coverage is partial: only participating
// utilities report, so "no data" must never be shown as "no outages". Edge-cached 5 minutes.
const BASE = "https://openenergyhub.ornl.gov/api/explore/v2.1/catalog/datasets/odin-real-time-outages-county/records";
const FIELDS = "state,county,metersaffected,name,reportedstarttime,estimatedrestorationtime";
const PAGE = 100;         // API maximum per request
const MAX_RECORDS = 3000; // safety cap

export const STATE_ABBR = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT",
  Delaware: "DE", "District of Columbia": "DC", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL",
  Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT",
  Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA",
  "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

// Customers out → map level (same color scale as weather alerts).
export function levelFor(customers) {
  if (customers >= 10000) return "Extreme";
  if (customers >= 1000) return "Severe";
  if (customers >= 100) return "Moderate";
  if (customers > 0) return "Minor";
  return "Clear";
}

function parseErt(v) {
  if (!v) return null;
  try { return JSON.parse(v).ert || null; } catch { return typeof v === "string" && !v.startsWith("{") ? v : null; }
}

// Pure function so it can be tested without network access.
export function summarizeOutages(records) {
  const states = {};
  for (const r of records) {
    const abbr = STATE_ABBR[r?.state];
    if (!abbr) continue;
    const st = (states[abbr] ||= { customers: 0, incidents: 0, counties: {}, utilities: new Set(), latestRestore: null });
    const n = Number(r.metersaffected) || 0;
    st.customers += n;
    st.incidents += 1;
    if (r.county) st.counties[r.county] = (st.counties[r.county] || 0) + n;
    if (r.name) st.utilities.add(String(r.name).split(",")[0].trim());
    const ert = parseErt(r.estimatedrestorationtime);
    if (ert && (!st.latestRestore || ert > st.latestRestore)) st.latestRestore = ert;
  }
  let customersOut = 0;
  const out = {};
  for (const [abbr, st] of Object.entries(states)) {
    customersOut += st.customers;
    out[abbr] = {
      level: levelFor(st.customers),
      customers: st.customers,
      incidents: st.incidents,
      counties: Object.entries(st.counties).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, customers]) => ({ name, customers })),
      utilities: [...st.utilities].slice(0, 6),
      latestRestore: st.latestRestore,
    };
  }
  return {
    updated: new Date().toISOString(),
    source: "U.S. Department of Energy ODIN (participating utilities only)",
    statesReporting: Object.keys(out).length,
    customersOut,
    states: out,
  };
}

async function getPage(offset) {
  const url = `${BASE}?select=${FIELDS}&limit=${PAGE}&offset=${offset}`;
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) return await res.json();
      lastErr = new Error(`ODIN responded ${res.status}`);
    } catch (err) { lastErr = err; }
  }
  throw lastErr;
}

export async function GET() {
  try {
    const first = await getPage(0);
    const total = Math.min(Number(first.total_count) || 0, MAX_RECORDS);
    const offsets = [];
    for (let o = PAGE; o < total; o += PAGE) offsets.push(o);
    const rest = await Promise.all(offsets.map(getPage));
    const records = [first, ...rest].flatMap((p) => p.results || []);
    return Response.json(summarizeOutages(records), {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (err) {
    console.error("outages_error", err?.message);
    return Response.json(
      { error: "Outage data is temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "public, s-maxage=60" } },
    );
  }
}
