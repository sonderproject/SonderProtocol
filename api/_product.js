// Single source of truth for Protocol 001. Shared by checkout + download.
export const PRODUCT = {
  id: "protocol-001",
  name: "Protocol 001 — The 30-Day Blackout Playbook",
  description: "Household Field Manual (PDF) with printable readiness worksheets.",
  // Live Stripe price (Stripe product prod_VYZR76xF5pd60u). Not a secret.
  stripePriceId: "price_1UXSJ5IVx1oH2W8LarHaJEWw",
  amountCents: 2700,
  currency: "usd",
  // How long a buyer's download link keeps working after purchase.
  accessDays: 14,
};

export function siteOrigin(request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  return new URL(request.url).origin;
}
