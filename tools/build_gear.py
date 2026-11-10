#!/usr/bin/env python3
"""Build gear.html — the public Sonder Gear page with Amazon Associates links.

Edit PRODUCTS below, then run:  python3 tools/build_gear.py
Each product links to a tagged Amazon search for the exact model. To use an exact
product page instead, set "url" to the SiteStripe link (it must keep ?tag=TAG).
Quantities, tiers, and buying order are paid content (Sonder Buy List) — keep them off this page.
"""
from html import escape
from pathlib import Path
from urllib.parse import quote_plus

TAG = "sonderprotoco-20"
DISCLOSURE = "As an Amazon Associate, Sonder Protocol earns from qualifying purchases."

PRODUCTS = [
    ("water", "Water", "Storage, filtration, and treatment. The first thing to secure.", [
        ("Reliance Aqua-Tainer 7 Gallon", "Our pick", "The most-recommended everyday water container, with a built-in spigot."),
        ("WaterBrick 3.5 Gallon", "Apartments", "Stackable storage for tight spaces and closets."),
        ("WaterBOB Bathtub Emergency Water Storage", "Storm prep", "Turns your tub into a sealed ~100 gallon reserve when a storm is forecast."),
        ("Sawyer Squeeze Water Filter", "Our pick", "High-capacity filter for bacteria and protozoa."),
        ("LifeStraw Personal Water Filter", "Budget", "Lightweight personal filter for go-bags."),
        ("Katadyn Micropur Purification Tablets", "Pair with filter", "Chemical treatment for what filters miss, including viruses."),
    ]),
    ("light", "Light", "Hands-free and room light that runs for days.", [
        ("Black Diamond Spot 400-R Headlamp", "Our pick", "USB-C rechargeable, hands-free, long low-mode runtime."),
        ("Goal Zero Lighthouse 600 Lantern", "Our pick", "Lights a whole room and charges a phone. Hand-crank backup."),
        ("Goal Zero Lighthouse Core Lantern", "Budget", "The same trusted lantern in a simpler package."),
        ("UST 30-Day Duro Lantern", "Long outages", "Built for extended outages on batteries."),
    ]),
    ("comms", "Information & Comms", "Stay informed and reach family when cell and internet are down.", [
        ("Midland ER310 Emergency Crank Weather Radio", "Our pick", "NOAA weather alerts via crank, solar, or battery."),
        ("FosPower A1 Emergency Weather Radio", "Budget", "Crank, solar, and battery radio with a phone charger."),
        ("Eton FRX3+ Emergency Weather Radio", "Alternative", "Hand turbine, solar, and NOAA weather bands."),
        ("Midland T77VP5 Two-Way Radio", "No license", "FRS walkie-talkies with NOAA alerts for nearby family."),
        ("Midland GXT1000VP4 GMRS Radio", "Long range", "More range. Requires an FCC GMRS license."),
    ]),
    ("power", "Power", "Keep phones, lights, and essentials running.", [
        ("Anker SOLIX C1000 Gen 2 Portable Power Station", "Our pick", "Top-rated all-rounder for home backup and essentials."),
        ("Jackery Explorer 300 Portable Power Station", "Compact", "Carry-in-one-hand power for phones, laptops, and lights."),
        ("EcoFlow River 2 Portable Power Station", "Budget", "Lightweight LiFePO4 unit that charges fast."),
        ("EcoFlow DELTA Pro 3", "Whole-home", "Serious backup for a fridge and essentials over days."),
        ("Jackery SolarSaga 100W Solar Panel", "Solar", "Refills a power station when the grid stays down. Match your station's brand."),
        ("BigBlue 28W Solar Charger", "Phones only", "Foldable panel that charges phones straight from the sun."),
    ]),
    ("heat", "Heat, Cooking & CO Safety", "Fuel-burning gear plus the alarm that makes it safe.", [
        ("First Alert CO400 Battery Carbon Monoxide Detector", "Non-negotiable", "Battery CO alarm. Outages are when CO poisonings spike."),
        ("Mr. Heater Portable Buddy MH9BX", "Our pick", "Indoor-rated propane heater with low-oxygen and tip-over shutoff."),
        ("Coleman Classic Propane 2-Burner Stove", "Our pick", "Hot meals and boiled water. Outdoors only."),
        ("Gas One GS-3400P Dual Fuel Stove", "Budget", "Runs on butane or propane. Outdoors only."),
        ("First Alert Home Fire Extinguisher", "Essential", "You're adding flame and fuel to your home. Plan for it."),
    ]),
    ("food", "Food", "Long shelf life, easy to prepare.", [
        ("Mountain House Emergency Food Bucket", "Our pick", "Freeze-dried meals with a very long shelf life and the best taste."),
        ("ReadyWise Emergency Food Supply", "Value", "More servings per dollar."),
        ("Heavy Duty Manual Can Opener", "Essential", "Your electric one won't work."),
    ]),
    ("medical", "Medical", "Find what you need fast, even by headlamp.", [
        ("Surviveware Large First Aid Kit", "Our pick", "Organized, labeled compartments for families."),
        ("First Aid Only 298 Piece First Aid Kit", "Budget", "Well-stocked, affordable household kit."),
        ("Insulin Medication Travel Cooler", "If needed", "Keeps refrigerated meds cool when the fridge is down."),
    ]),
    ("sanitation", "Sanitation", "When water pressure fails, toilets stop working.", [
        ("Reliance Luggable Loo Portable Toilet", "Our pick", "5-gallon bucket toilet with a snap-on seat and lid."),
        ("Reliance Double Doodie Toilet Waste Bags", "Stock up", "Leak-proof bags with gel. You'll need more than you think."),
    ]),
]


def amazon_search(name: str) -> str:
    return f"https://www.amazon.com/s?k={quote_plus(name)}&tag={TAG}"


def card(name, role, why):
    return f'''          <article class="gear-card">
            <span class="tag{' tag--orange' if role.lower() in ('our pick', 'non-negotiable') else ''}">{escape(role)}</span>
            <h3>{escape(name)}</h3>
            <p>{escape(why)}</p>
            <a class="gear-card__link" href="{escape(amazon_search(name))}" target="_blank" rel="sponsored nofollow noopener">Shop on Amazon <span class="btn__arrow">→</span></a>
          </article>'''


def build():
    root = Path(__file__).resolve().parent.parent
    index = (root / "index.html").read_text()
    # Reuse the homepage <head> fonts/styles and the header block so the page always matches.
    head_links = index[index.index('<link rel="icon"'):index.index('<link rel="preload"')]
    header = index[index.index('  <header class="site-header"'):index.index('  </header>') + len('  </header>')]
    header = header.replace('href="#inside"', 'href="/#inside"').replace('href="#kit"', 'href="/#kit"') \
                   .replace('href="#faq"', 'href="/#faq"').replace('href="#buy"', 'href="/#buy"').replace('href="#top"', 'href="/"')

    jump = "\n".join(f'          <a href="#{cid}">{escape(title)}</a>' for cid, title, _, _ in PRODUCTS)
    sections = []
    for i, (cid, title, blurb, items) in enumerate(PRODUCTS, 1):
        cards = "\n".join(card(*it) for it in items)
        sections.append(f'''    <section class="gear-cat" id="{cid}">
      <div class="container">
        <header class="gear-cat__head">
          <p class="label reveal"><span class="label__n">{i:02d}</span><i class="label__rule"></i><span>{escape(title)}</span></p>
          <p class="gear-cat__blurb">{escape(blurb)}</p>
        </header>
        <div class="gear-grid">
{cards}
        </div>
      </div>
    </section>''')

    html = f'''<!doctype html>
<!-- GENERATED by tools/build_gear.py — edit the PRODUCTS list there, not this file. -->
<html lang="en" data-bonus="off">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Emergency Gear We Recommend — Sonder Protocol</title>
  <meta name="description" content="The emergency preparedness gear Sonder Protocol recommends for power outages: water storage and filters, lights, weather radios, power stations, heat, food, first aid, and sanitation." />
  <meta name="theme-color" content="#06080a" />
  {head_links.strip()}
  <link rel="stylesheet" href="assets/css/styles.css" />
</head>
<body class="page-gear">
  <a class="skip-link" href="#main">Skip to content</a>

{header}

  <main id="main">
    <section class="gear-hero">
      <div class="aurora" aria-hidden="true"></div>
      <div class="grain" aria-hidden="true"></div>
      <div class="container gear-hero__inner">
        <p class="pill reveal"><span class="pill__dot"></span>The Sonder Gear List</p>
        <h1 class="block__title reveal">Gear we'd trust<br /><span class="muted">when the power goes out.</span></h1>
        <p class="gear-hero__sub reveal">Our picks for every category, from water to power to sanitation. Want the exact quantities for your household and the order to buy them in? That's in the Blackout Kit.</p>
        <p class="gear-disclosure reveal">{escape(DISCLOSURE)} Prices and availability are set by Amazon.</p>
        <nav class="gear-jump reveal" aria-label="Gear categories">
{jump}
        </nav>
      </div>
    </section>

{chr(10).join(sections)}

    <section class="cta" id="buy">
      <div class="aurora" aria-hidden="true"></div>
      <div class="container cta__inner reveal">
        <p class="pill"><span class="pill__dot"></span>Protocol 001 · The Blackout Kit</p>
        <h2 class="cta__title">Know what to buy.<br /><span class="shimmer">And what to do with it.</span></h2>
        <p class="cta__sub">The 30-Day Blackout Playbook turns this gear into a plan: exact quantities for your household, the order to buy in, and what to do hour by hour.</p>
        <div class="cta__form"><a href="/#buy" class="btn btn--primary btn--lg shine">Get the Blackout Kit <span class="btn__arrow">→</span></a></div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container footer__base">
      <span>© <span data-year>2026</span> Sonder Protocol. {escape(DISCLOSURE)}</span>
      <span class="mono"><a href="/">Home</a> · <a href="/gear">Gear</a></span>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js" defer></script>
  <script src="assets/js/main.js" defer></script>
</body>
</html>
'''
    (root / "gear.html").write_text(html)
    n = sum(len(c[3]) for c in PRODUCTS)
    print(f"gear.html written: {len(PRODUCTS)} categories, {n} products, tag={TAG}")


if __name__ == "__main__":
    build()
