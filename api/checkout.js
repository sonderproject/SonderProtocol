import Stripe from "stripe";
import { PRODUCT, siteOrigin } from "./_product.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/checkout → 303 redirect to Stripe-hosted Checkout.
export async function POST(request) {
  const origin = siteOrigin(request);

  const priceId = process.env.STRIPE_PRICE_ID || PRODUCT.stripePriceId;
  const lineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: PRODUCT.currency,
          unit_amount: PRODUCT.amountCents,
          product_data: { name: PRODUCT.name, description: PRODUCT.description },
        },
      };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [lineItem],
      metadata: { product: PRODUCT.id },
      allow_promotion_codes: true,
      custom_text: {
        submit: {
          message: `Instant digital download. All sales are final: no refunds, returns or exchanges. By paying you agree to our Terms of Sale (${origin}/terms) and Privacy Policy (${origin}/privacy).`,
        },
      },
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#buy`,
    });
    return Response.redirect(session.url, 303);
  } catch (err) {
    console.error("checkout_error", err?.message);
    return Response.redirect(`${origin}/?checkout=error#buy`, 303);
  }
}

export function GET(request) {
  return Response.redirect(`${siteOrigin(request)}/#buy`, 303);
}
