// GET /api/where → the visitor's country and state/region, from Vercel's IP geolocation headers.
// Nothing is stored or logged. Used only to show local alerts on the homepage. Never cached.
export function GET(request) {
  const country = request.headers.get("x-vercel-ip-country") || "";
  const region = request.headers.get("x-vercel-ip-country-region") || "";
  return Response.json(
    { country, region: country === "US" ? region.toUpperCase() : "" },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
