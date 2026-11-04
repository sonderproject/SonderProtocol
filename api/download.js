import Stripe from "stripe";
import { issueSignedToken, presignUrl, list } from "@vercel/blob";
import { PRODUCT, siteOrigin } from "./_product.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const LINK_TTL_MS = 5 * 60 * 1000; // presigned PDF URL lives 5 minutes

// GET /api/download?session_id=cs_...[&file=bonus] → verifies payment, 302s to a short-lived private Blob URL.
// file=playbook (default) serves the Playbook; file=bonus serves the Buy List bonus.
export async function GET(request) {
  const origin = siteOrigin(request);
  const params = new URL(request.url).searchParams;
  const sessionId = params.get("session_id") || "";
  const file = params.get("file") === "bonus" ? "bonus" : "playbook";
  const deny = (reason) => Response.redirect(`${origin}/success.html?error=${reason}`, 302);

  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return deny("invalid");

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return deny("invalid");
  }

  // "no_payment_required" = order fully covered by a 100%-off promotion code.
  const settled = session.status === "complete" &&
    (session.payment_status === "paid" || session.payment_status === "no_payment_required");
  if (!settled || session.metadata?.product !== PRODUCT.id) {
    return deny("unpaid");
  }
  const ageMs = Date.now() - session.created * 1000;
  if (ageMs > PRODUCT.accessDays * 24 * 60 * 60 * 1000) return deny("expired");

  try {
    const pathname = await findPdfPathname(file);
    if (!pathname) {
      console.error("download_error", `no ${file} PDF found in Blob store`);
      return deny("unavailable");
    }
    const validUntil = Date.now() + LINK_TTL_MS;
    const token = await issueSignedToken({ pathname, operations: ["get"], validUntil });
    const { presignedUrl } = await presignUrl(token, {
      operation: "get",
      pathname,
      validUntil,
      access: "private",
    });
    return new Response(null, {
      status: 302,
      headers: { Location: presignedUrl, "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("download_error", err?.message);
    return deny("unavailable");
  }
}

// The bonus is any PDF whose name contains "buy-list", "buylist", "buy list" or "bonus".
// The Playbook is the other PDF. Env vars override auto-detection.
const BONUS_NAME = /buy[-_ ]?list|bonus/i;

async function findPdfPathname(file) {
  const override = file === "bonus" ? process.env.BONUS_BLOB_PATHNAME : process.env.PDF_BLOB_PATHNAME;
  if (override) return override;
  let cursor;
  do {
    const page = await list({ limit: 1000, cursor });
    const pdf = page.blobs.find((b) => {
      const name = b.pathname.toLowerCase();
      if (!name.endsWith(".pdf")) return false;
      return file === "bonus" ? BONUS_NAME.test(name) : !BONUS_NAME.test(name);
    });
    if (pdf) return pdf.pathname;
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return null;
}
