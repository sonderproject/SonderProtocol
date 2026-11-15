#!/usr/bin/env python3
"""Build privacy.html and terms.html (served at /privacy and /terms).

Run:  python3 tools/build_legal.py   (re-run after changing the homepage header or the policy text)
"""
from pathlib import Path

CONTACT = "drsv0913@gmail.com"
UPDATED = "November 15, 2026"
SITE = "Sonder Protocol"

PRIVACY = f"""
<p class="legal__lede">This policy explains what information {SITE} ("we", "us") collects when you visit this website or buy a product, how it is used, and the choices you have. We keep data collection to the minimum needed to sell and deliver digital products.</p>

<h2>Information we collect</h2>
<ul>
  <li><strong>Purchase information.</strong> When you buy, checkout is handled by Stripe. Stripe collects your name, email address, billing details and card information. We never see or store your full card number. We receive your email, the order details and the payment status from Stripe so we can deliver your download and provide support.</li>
  <li><strong>Technical information.</strong> Like all websites, our hosting provider (Vercel) automatically processes your IP address, browser type, and the pages you request, so the site can load and stay secure. These logs are kept for a short period.</li>
  <li><strong>Information you send us.</strong> If you email us, we keep the message and your email address to respond.</li>
</ul>
<p>We do not use advertising trackers, analytics cookies or tracking pixels, and we do not ask for an account or password.</p>

<h2>Free tools</h2>
<p>The Readiness Calculator runs entirely in your browser. The answers you enter are not sent to us or stored. The Live Map loads public data from the National Weather Service and the U.S. Department of Energy. It does not ask for or use your location.</p>

<h2>Third-party services</h2>
<ul>
  <li><strong>Stripe</strong> processes payments under its own <a href="https://stripe.com/privacy" rel="noopener">privacy policy</a>.</li>
  <li><strong>Vercel</strong> hosts the site and securely stores the digital files you buy.</li>
  <li><strong>Google Fonts</strong> serves the site's typefaces, which means your browser connects to Google and shares your IP address with it. See <a href="https://policies.google.com/privacy" rel="noopener">Google's privacy policy</a>.</li>
  <li><strong>Amazon Associates.</strong> Some gear links go to Amazon. If you click one, Amazon may set cookies to credit us with a commission on qualifying purchases. That happens on Amazon's site, under <a href="https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ" rel="noopener">Amazon's privacy notice</a>.</li>
</ul>

<h2>How we use information</h2>
<p>We use it only to process your order and deliver your download, provide customer support, prevent fraud and abuse, keep the site secure, and meet legal, tax and accounting requirements.</p>

<h2>We do not sell your data</h2>
<p>We do not sell or rent personal information, and we do not share it for cross-context behavioral advertising. We share it only with the service providers above, so they can perform services for us, or when the law requires it.</p>

<h2>Retention</h2>
<p>Order records are kept as long as needed for tax, accounting and dispute purposes, typically up to seven years. Support emails are kept while they are useful for helping you.</p>

<h2>Your rights</h2>
<p>Depending on where you live (including California under the CCPA/CPRA), you may have the right to know what personal information we hold about you, to get a copy of it, to have it corrected or deleted, and to opt out of its sale or sharing (we don't sell or share it). To make a request, email <a href="mailto:{CONTACT}">{CONTACT}</a>. We will verify the request using the email address on your order. We will not treat you differently for using these rights.</p>

<h2>Security</h2>
<p>The site is served only over HTTPS. Payments are handled by Stripe, and downloads are protected by short-lived, payment-verified links. No method of transmission or storage is 100% secure, but we work to protect your information.</p>

<h2>Children</h2>
<p>This site is not directed to children under 13, and we do not knowingly collect their personal information.</p>

<h2>Changes</h2>
<p>We may update this policy. The date at the top shows when it last changed.</p>

<h2>Contact</h2>
<p>Questions or requests: <a href="mailto:{CONTACT}">{CONTACT}</a></p>
"""

TERMS = f"""
<p class="legal__lede">These Terms of Sale and Use ("Terms") apply to your use of this website and any purchase from {SITE} ("we", "us"). By using the site or completing a purchase, you agree to these Terms.</p>

<div class="legal__callout">
  <h2>All sales are final</h2>
  <p>Our products are digital downloads that are delivered instantly. <strong>Because of this, all sales are final. We do not offer refunds, returns or exchanges</strong>, including for change of mind or a purchase made by mistake. Please review the product description before you buy.</p>
  <p>If a file won't download or is damaged, email <a href="mailto:{CONTACT}">{CONTACT}</a> within 14 days of purchase and we will replace it. Nothing in these Terms limits any rights you have under applicable law that cannot be waived.</p>
</div>

<h2>1. Products and delivery</h2>
<p>When your payment is confirmed, you get a download link on the confirmation page. Download links stay active for 14 days after purchase. Save your files to your device and keep a printed copy. We may fix or update product content over time. Free bonuses (such as the Buy List) come with qualifying purchases while offered, and may change or end at any time.</p>

<h2>2. Prices and payment</h2>
<p>Prices are shown in U.S. dollars and processed securely by Stripe. Sale prices are valid only during the stated sale period. Promotion codes cannot be combined unless stated and have no cash value. Any applicable taxes are shown at checkout.</p>

<h2>3. Chargebacks</h2>
<p>If there's a problem with your order, please contact us before disputing the charge with your bank, and we'll work to fix it. Records of payment and delivery are kept and may be provided in response to a dispute.</p>

<h2>4. License: personal use only</h2>
<p>When you buy, you get a personal, non-exclusive, non-transferable license to download, view and print the product for use by your own household. You may not resell, share, distribute, publish, upload, or post the files (or substantial parts of them), or use them to create a competing product. All content is owned by {SITE} and protected by copyright. Purchases are not a transfer of ownership.</p>

<h2>5. Informational purposes only, not professional advice</h2>
<p>Our products, free tools and website content are general educational information about emergency preparedness. They are <strong>not</strong> medical, legal, electrical, engineering, or other professional advice, and they do not replace instructions from emergency officials, manufacturers, or qualified professionals.</p>
<ul>
  <li>In an emergency, call 911 and follow instructions from local authorities.</li>
  <li>Never run generators, grills, camp stoves or fuel-burning heaters indoors or in enclosed spaces. Carbon monoxide can kill. Always follow manufacturer instructions and local codes.</li>
  <li>Calculator results are estimates and may not meet your household's specific medical, dietary or other needs.</li>
</ul>
<p>You are responsible for how you use the information. Preparedness lowers risk but cannot remove it.</p>

<h2>6. Free tools and live data</h2>
<p>The Live Map shows public data from the National Weather Service and the U.S. Department of Energy. That data may be delayed, incomplete or inaccurate. Many utilities do not report outages, so a state with no reports may still have outages. Do not rely on our tools for safety decisions. Always check official sources. Free tools are provided as is and may change or be unavailable at any time.</p>

<h2>7. Affiliate disclosure</h2>
<p>As an Amazon Associate, we earn from qualifying purchases. Some links on this site are affiliate links. We may earn a commission if you buy through them, at no extra cost to you. Product prices and availability are set by the retailer and change often. Approximate prices we show are for planning only. Products are sold and warranted by their sellers and manufacturers, not by us.</p>

<h2>8. Disclaimer of warranties</h2>
<p>To the fullest extent permitted by law, the site, products and tools are provided "as is" and "as available", without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose and non-infringement. We do not guarantee any particular outcome during an emergency.</p>

<h2>9. Limitation of liability</h2>
<p>To the fullest extent permitted by law, {SITE} will not be liable for any indirect, incidental, special, consequential or punitive damages, or for any injury, loss or damage arising from your use of, or reliance on, our products, tools, website or recommended third-party products. Our total liability for any claim will not exceed the amount you paid us for the product involved.</p>

<h2>10. Acceptable use</h2>
<p>Do not misuse the site. That includes attempting to get around payment or download protections, scraping or overloading our services, or sharing download links publicly. We may revoke access for violations of these Terms.</p>

<h2>11. Governing law</h2>
<p>These Terms are governed by the laws of the State of California, without regard to conflict-of-law rules. Any dispute will be resolved in the state or federal courts located in San Diego County, California, unless applicable law requires otherwise.</p>

<h2>12. Changes</h2>
<p>We may update these Terms. The version in effect when you buy applies to that purchase.</p>

<h2>13. Contact</h2>
<p><a href="mailto:{CONTACT}">{CONTACT}</a></p>
"""


def page(header, head_links, *, slug, title, desc, body):
    return f'''<!doctype html>
<!-- GENERATED by tools/build_legal.py — edit that script, not this file. -->
<html lang="en" data-bonus="on">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title} — Sonder Protocol</title>
  <meta name="description" content="{desc}" />
  <meta name="theme-color" content="#06080a" />
  <link rel="canonical" href="https://sonderprotocol.vercel.app/{slug}" />
  {head_links.strip()}
  <link rel="stylesheet" href="/assets/css/styles.css" />
</head>
<body class="page-legal">
  <a class="skip-link" href="#main">Skip to content</a>

{header}

  <main id="main" class="legal">
    <div class="container legal__inner">
      <p class="pill"><span class="pill__dot"></span>Legal</p>
      <h1 class="legal__title">{title}</h1>
      <p class="legal__updated mono">Last updated {UPDATED}</p>
      {body.strip()}
    </div>
  </main>

  <footer class="footer">
    <div class="container footer__base">
      <span>© <span data-year>2026</span> Sonder Protocol. All sales final.</span>
      <span class="mono"><a href="/">Home</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></span>
    </div>
  </footer>

  <script src="/assets/js/vendor/lenis-1.1.13.min.js" defer></script>
  <script src="/assets/js/main.js" defer></script>
</body>
</html>
'''


def build():
    root = Path(__file__).resolve().parent.parent
    index = (root / "index.html").read_text()
    head_links = index[index.index('<link rel="icon"'):index.index('<link rel="preload"')]
    head_links = head_links.replace('href="assets/', 'href="/assets/')
    header = index[index.index('  <header class="site-header"'):index.index('  </header>') + len('  </header>')]
    for anchor in ("#inside", "#kit", "#faq", "#buy", "#calc"):
        header = header.replace(f'href="{anchor}"', f'href="/{anchor}"')
    header = header.replace('href="#top"', 'href="/"')

    (root / "privacy.html").write_text(page(
        header, head_links, slug="privacy", title="Privacy Policy",
        desc="How Sonder Protocol collects, uses and protects your information.", body=PRIVACY))
    (root / "terms.html").write_text(page(
        header, head_links, slug="terms", title="Terms of Sale",
        desc="Terms of sale and use for Sonder Protocol. All sales of digital products are final.", body=TERMS))
    print("privacy.html and terms.html written")


if __name__ == "__main__":
    build()
