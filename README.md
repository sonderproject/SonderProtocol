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
   | `PDF_BLOB_PATHNAME` | the pathname from step 3, e.g. `protocol-001/30-day-blackout-playbook.pdf` |
   | `SITE_URL` | optional, e.g. `https://sonderprotocol.com` |
   | `STRIPE_PRICE_ID` | optional; if unset, checkout charges $27 inline |
5. **Stripe:** Settings → Customer emails → turn on *Successful payments* so buyers get a receipt.
6. Redeploy, then run one test purchase with card `4242 4242 4242 4242` while on the test key.
