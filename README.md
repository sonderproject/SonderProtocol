# Sonder Protocol

Static site plus two Vercel serverless functions. They sell Protocol 001 (The 30-Day Blackout Playbook, $27) through Stripe Checkout and deliver the PDF from **private** Vercel Blob storage via 5-minute signed URLs.

```
index.html, success.html, assets/   static site
api/checkout.js                     POST → creates Stripe Checkout session → redirects to Stripe
api/download.js                     GET ?session_id= → verifies paid session → 302 to signed PDF URL
api/_product.js                     product name, price ($27), access window (14 days)
```

**Never commit the PDF.** This repo is public; `*.pdf` is gitignored.

## Go-live setup (one time)

1. **Vercel:** import `sonderproject/SonderProtocol` as a new project (Framework: Other, no build command). Production branch: `main`.
2. **Private Blob store:** Project → Storage → Create Blob store → access **Private** → connect it to the project (this adds the Blob credentials automatically).
3. **Upload the PDF** to that store from the Blob dashboard, e.g. as `protocol-001/30-day-blackout-playbook.pdf`.
4. **Environment variables** (Project → Settings → Environment Variables):
   | Name | Value |
   |---|---|
   | `STRIPE_SECRET_KEY` | `sk_live_...` (use `sk_test_...` first to test) |
   | `PDF_BLOB_PATHNAME` | optional; if unset, the first `.pdf` in the connected Blob store is used |
   | `SITE_URL` | optional, e.g. `https://sonderprotocol.com` |
   | `STRIPE_PRICE_ID` | optional; overrides the live price ID in `api/_product.js` |
5. **Stripe:** Settings → Customer emails → turn on *Successful payments* so buyers get a receipt.
6. Redeploy, then run one test purchase with card `4242 4242 4242 4242` while on the test key.

## Bonus PDF (The Sonder Buy List)

Bonus content is hidden until switched on.

1. Upload the bonus PDF to the same private Blob store. Its filename must contain `buy-list`, `buylist`, `buy list` or `bonus` (e.g. `sonder-buy-list.pdf`). Any other PDF is treated as the Playbook. Optional overrides: `BONUS_BLOB_PATHNAME`, `PDF_BLOB_PATHNAME`.
2. In `index.html` and `success.html`, change `<html lang="en" data-bonus="off">` to `data-bonus="on"`.
3. Push to `main`. The success page then shows a second download button (`/api/download?session_id=...&file=bonus`).

## Gear page (Amazon Associates)

`/gear` lists recommended products with Amazon Associates links (tracking ID `sonderprotoco-20`).

- Edit products in `tools/build_gear.py`, then run `python3 tools/build_gear.py` to regenerate `gear.html`.
- Links are tagged Amazon searches for each exact model. To point at an exact product page, add the SiteStripe link (must keep `?tag=sonderprotoco-20`).
- Amazon does not allow Associates links inside PDFs or e-books. The paid Buy List PDF must link to `/gear`, never directly to Amazon.
- Keep the Associates disclosure on any page with Amazon links.
