import Stripe from "stripe";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { PRODUCT, siteOrigin } from "./_product.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const LINK_TTL_MS = 5 * 60 * 1000; // presigned PDF URL lives 5 minutes

// GET /api/download?session_id=cs_... → verifies payment, 302s to a short-lived private Blob URL.
export async function GET(request) {
  const origin = siteOrigin(request);
  const sessionId = new URL(request.url).searchParams.get("session_id") || "";
  const deny = (reason) => Response.redirect(`${origin}/success.html?error=${reason}`, 302);

  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return deny("invalid");

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return deny("invalid");
  }

  if (session.payment_status !== "paid" || session.metadata?.product !== PRODUCT.id) {
    return deny("unpaid");
  }
  const ageMs = Date.now() - session.created * 1000;
  if (ageMs > PRODUCT.accessDays * 24 * 60 * 60 * 1000) return deny("expired");

  const pathname = process.env.PDF_BLOB_PATHNAME;
  if (!pathname) {
    console.error("download_error", "PDF_BLOB_PATHNAME not set");
    return deny("unavailable");
  }

  try {
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
