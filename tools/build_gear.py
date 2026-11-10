#!/usr/bin/env python3
"""Build the two gear pages from one product list.

  gear.html      → /gear      public "Top Picks": one product per category (affiliate + teaser)
  gear-kit.html  → /gear/kit  unlisted buyer page linked only from the Buy List PDF:
                              every pick with quantity, tier, approx price, plus budget kits

Run:  python3 tools/build_gear.py   (re-run after changing PRODUCTS or the homepage header)
Each product links to its exact Amazon page (ASINS) or a tagged search for the exact model.
Amazon does not allow Associates links inside PDFs, so the PDF must link to /gear/kit, never Amazon.
"""
from html import escape
from pathlib import Path
from urllib.parse import quote_plus

TAG = "sonderprotoco-20"
DISCLOSURE = "As an Amazon Associate, Sonder Protocol earns from qualifying purchases."
PRICE_NOTE = "Prices are typical US prices as of November 2026, rounded. Amazon shows the live price."

# (name, role, why, qty, tier, approx_price_usd or None). TOP marks the public pick per category.
PRODUCTS = [
    ("water", "Water", "Storage, filtration, and treatment. The first thing to secure.", [
        ("Reliance Aqua-Tainer 7 Gallon", "Our pick", "The most-recommended everyday water container, with a built-in spigot.", "1 per person, per week", 1, 25),
        ("WaterBrick 3.5 Gallon", "Apartments", "Stackable storage for tight spaces and closets.", "2 per person, per week", 1, None),
        ("WaterBOB Bathtub Emergency Water Storage", "Storm prep", "Turns your tub into a sealed ~100 gallon reserve when a storm is forecast.", "1 per household", 1, 35),
        ("Sawyer Squeeze Water Filter", "Our pick", "High-capacity filter for bacteria and protozoa.", "1 per person", 2, 45),
        ("LifeStraw Personal Water Filter", "Budget", "Lightweight personal filter for go-bags.", "1 per person", 2, 15),
        ("Katadyn Micropur Purification Tablets", "Pair with filter", "Chemical treatment for what filters miss, including viruses.", "1 pack per person", 2, 16),
    ]),
    ("light", "Light", "Hands-free and room light that runs for days.", [
        ("Black Diamond Spot 400-R Headlamp", "Our pick", "USB-C rechargeable, hands-free, long low-mode runtime.", "1 per person", 1, 70),
        ("Goal Zero Lighthouse 600 Lantern", "Our pick", "Lights a whole room and charges a phone. Hand-crank backup.", "1–2 per household", 1, None),
        ("Goal Zero Lighthouse Core Lantern", "Budget", "The same trusted lantern in a simpler package.", "1–2 per household", 1, 50),
        ("UST 30-Day Duro Lantern", "Long outages", "Built for extended outages on batteries.", "1 per household", 3, None),
    ]),
    ("comms", "Information & Comms", "Stay informed and reach family when cell and internet are down.", [
        ("Midland ER310 Emergency Crank Weather Radio", "Our pick", "NOAA weather alerts via crank, solar, or battery.", "1 per household", 1, 70),
        ("FosPower A1 Emergency Weather Radio", "Budget", "Crank, solar, and battery radio with a flashlight and phone charger.", "1 per household", 1, 30),
        ("Eton FRX3+ Emergency Weather Radio", "Alternative", "Hand turbine, solar, and NOAA weather bands.", "1 per household", 1, None),
        ("Midland T77VP5 Two-Way Radio", "No license", "FRS walkie-talkies with NOAA alerts for nearby family.", "1 pair+ per household", 2, None),
        ("Midland GXT1000VP4 GMRS Radio", "Long range", "More range. Requires an FCC GMRS license.", "1 set", 3, None),
    ]),
    ("power", "Power", "Keep phones, lights, and essentials running.", [
        ("Anker SOLIX C1000 Gen 2 Portable Power Station", "Our pick", "Top-rated all-rounder for home backup and essentials.", "1 per household", 2, 450),
        ("Jackery Explorer 300 Portable Power Station", "Compact", "Carry-in-one-hand power for phones, laptops, and lights.", "1 per household", 2, None),
        ("EcoFlow River 2 Portable Power Station", "Budget", "Lightweight LiFePO4 unit that charges fast.", "1 per household", 2, None),
        ("EcoFlow DELTA Pro 3", "Whole-home", "Serious backup for a fridge and essentials over days.", "1 per household", 3, None),
        ("Jackery SolarSaga 100W Solar Panel", "Solar", "Refills a power station when the grid stays down. Match your station's brand.", "1–2", 3, None),
        ("BigBlue 28W Solar Charger", "Phones only", "Foldable panel that charges phones straight from the sun.", "1", 3, None),
    ]),
    ("heat", "Heat, Cooking & CO Safety", "Fuel-burning gear plus the alarm that makes it safe.", [
        ("First Alert CO400 Battery Carbon Monoxide Detector", "Non-negotiable", "Battery CO alarm. Outages are when CO poisonings spike.", "1 per sleeping area + 1 near any heater", 1, 25),
        ("Mr. Heater Portable Buddy MH9BX", "Our pick", "Indoor-rated propane heater with low-oxygen and tip-over shutoff.", "1", 2, 90),
        ("Coleman Classic Propane 2-Burner Stove", "Our pick", "Hot meals and boiled water. Outdoors only.", "1", 2, 90),
        ("Gas One GS-3400P Dual Fuel Stove", "Budget", "Runs on butane or propane. Outdoors only.", "1", 2, None),
        ("First Alert Home Fire Extinguisher", "Essential", "You're adding flame and fuel to your home. Plan for it.", "1 per floor + kitchen", 1, None),
    ]),
    ("food", "Food", "Long shelf life, easy to prepare.", [
        ("Mountain House Emergency Food Bucket", "Our pick", "Freeze-dried meals with a very long shelf life and the best taste.", "Per the Playbook's Quantity Engine", 3, 90),
        ("ReadyWise Emergency Food Supply", "Value", "More servings per dollar.", "Per the Quantity Engine", 3, None),
        ("Heavy Duty Manual Can Opener", "Essential", "Your electric one won't work.", "2", 1, None),
    ]),
    ("medical", "Medical", "Find what you need fast, even by headlamp.", [
        ("Surviveware Large First Aid Kit", "Our pick", "Organized, labeled compartments for families.", "1 per household + 1 per car", 1, None),
        ("First Aid Only 298 Piece First Aid Kit", "Budget", "Well-stocked, affordable household kit.", "1 per household + 1 per car", 1, 20),
        ("Insulin Medication Travel Cooler", "If needed", "Keeps refrigerated meds cool when the fridge is down.", "If needed", 2, None),
    ]),
    ("sanitation", "Sanitation", "When water pressure fails, toilets stop working.", [
        ("Reliance Luggable Loo Portable Toilet", "Our pick", "5-gallon bucket toilet with a snap-on seat and lid.", "1 per household", 2, 30),
        ("Reliance Double Doodie Toilet Waste Bags", "Stock up", "Leak-proof bags with gel. You'll need more than you think.", "~1 per person per day", 2, 18),
    ]),
]

# Public /gear shows only these (one per category).
TOP = {
    "Reliance Aqua-Tainer 7 Gallon", "Black Diamond Spot 400-R Headlamp", "Midland ER310 Emergency Crank Weather Radio",
    "Anker SOLIX C1000 Gen 2 Portable Power Station", "First Alert CO400 Battery Carbon Monoxide Detector",
    "Mountain House Emergency Food Bucket", "First Aid Only 298 Piece First Aid Kit", "Reliance Luggable Loo Portable Toilet",
}

# Budget kits: (id, name, who, [(product, qty)], extra note). Totals computed from approx prices.
BUDGET_KITS = [
    ("starter", "$100 Starter", "1–2 people · 72 hours", [
        ("Reliance Aqua-Tainer 7 Gallon", 1), ("LifeStraw Personal Water Filter", 1),
        ("FosPower A1 Emergency Weather Radio", 1), ("First Alert CO400 Battery Carbon Monoxide Detector", 1),
    ], "Covers water, a filter, light and news (the radio has a flashlight and phone charger), and the CO alarm. Add cash in small bills."),
    ("solid", "$300 Solid", "Family of 4 · 14 days", [
        ("Reliance Aqua-Tainer 7 Gallon", 4), ("Sawyer Squeeze Water Filter", 1), ("FosPower A1 Emergency Weather Radio", 1),
        ("Goal Zero Lighthouse Core Lantern", 1), ("First Alert CO400 Battery Carbon Monoxide Detector", 1),
        ("First Aid Only 298 Piece First Aid Kit", 1), ("Reliance Double Doodie Toilet Waste Bags", 1),
    ], "Add a WaterBOB (~$35) when a storm is forecast to top up to 100+ gallons."),
    ("prepared", "$1,000 Fully Prepared", "Family of 4 · 30 days", [
        ("Reliance Aqua-Tainer 7 Gallon", 4), ("Sawyer Squeeze Water Filter", 1), ("FosPower A1 Emergency Weather Radio", 1),
        ("Goal Zero Lighthouse Core Lantern", 1), ("First Alert CO400 Battery Carbon Monoxide Detector", 2),
        ("First Aid Only 298 Piece First Aid Kit", 1), ("Reliance Double Doodie Toilet Waste Bags", 1),
        ("Anker SOLIX C1000 Gen 2 Portable Power Station", 1), ("Mr. Heater Portable Buddy MH9BX", 1),
        ("Coleman Classic Propane 2-Burner Stove", 1), ("Reliance Luggable Loo Portable Toilet", 1),
    ], "Plus propane cylinders for the heater and stove. Build food from the Playbook's pantry plan, or add a Mountain House bucket (~$90)."),
]

# Exact Amazon product IDs (ASINs), cross-checked against multiple listings (Nov 2026).
# Products not listed here fall back to a tagged search for the exact model.
# "check" = single-source or variant risk: spot-check these first.
ASINS = {
    "Reliance Aqua-Tainer 7 Gallon": "B001QC31G6",
    "WaterBOB Bathtub Emergency Water Storage": "B001AXLUX2",
    "Sawyer Squeeze Water Filter": "B00B1OSU4W",              # check
    "LifeStraw Personal Water Filter": "B006QF3TW4",
    "Katadyn Micropur Purification Tablets": "B0007U017U",
    "Black Diamond Spot 400-R Headlamp": "B09NQK87MN",
    "Goal Zero Lighthouse 600 Lantern": "B08HRM4J8Y",
    "Midland ER310 Emergency Crank Weather Radio": "B015QIC1PW",
    "FosPower A1 Emergency Weather Radio": "B07FKYHTWP",
    "Midland GXT1000VP4 GMRS Radio": "B001WMFYH4",
    "Anker SOLIX C1000 Gen 2 Portable Power Station": "B0FN7MSY4L",  # check
    "Jackery Explorer 300 Portable Power Station": "B082TMBYR6",
    "EcoFlow River 2 Portable Power Station": "B0B8MXPRDB",
    "EcoFlow DELTA Pro 3": "B0DDKP47PY",                        # check
    "First Alert CO400 Battery Carbon Monoxide Detector": "B000N8OYXI",
    "Mr. Heater Portable Buddy MH9BX": "B000JT7IGQ",            # check
    "Coleman Classic Propane 2-Burner Stove": "B00005OU9D",
    "Gas One GS-3400P Dual Fuel Stove": "B01HQRD8EO",           # check
    "First Aid Only 298 Piece First Aid Kit": "B000069EYA",
    "Reliance Luggable Loo Portable Toilet": "B000FIAPXO",
}

TIER = {1: "T1 · Buy first", 2: "T2 · Build out", 3: "T3 · Upgrade"}
BY_NAME = {it[0]: it for c in PRODUCTS for it in c[3]}


def amazon_link(name: str) -> str:
    asin = ASINS.get(name)
    return f"https://www.amazon.com/dp/{asin}?tag={TAG}" if asin else amazon_search(name)


def amazon_search(name: str) -> str:
    return f"https://www.amazon.com/s?k={quote_plus(name)}&tag={TAG}"


def shop(name):
    return f'<a class="gear-card__link" href="{escape(amazon_link(name))}" target="_blank" rel="sponsored nofollow noopener">Shop on Amazon <span class="btn__arrow">→</span></a>'


def card(item, full):
    name, role, why, qty, tier, price = item
    tag_cls = " tag--orange" if role.lower() in ("our pick", "non-negotiable") else ""
    meta = ""
    if full:
        price_s = f'<span>~${price}</span>' if price else ""
        meta = f'<p class="gear-card__meta"><span class="tierchip t{tier}">{TIER[tier]}</span><span>Qty: {escape(qty)}</span>{price_s}</p>'
    return f'''          <article class="gear-card">
            <span class="tag{tag_cls}">{escape(role)}</span>
            <h3>{escape(name)}</h3>
            <p>{escape(why)}</p>
            {meta}
            {shop(name)}
          </article>'''


def kit_total(items):
    return sum((BY_NAME[n][5] or 0) * q for n, q in items)


def budget_kits_html():
    out = []
    for kid, name, who, items, note in BUDGET_KITS:
        rows = "".join(
            f'<li><span class="bk__qty">{q}×</span><span class="bk__name">{escape(n)}</span><span class="bk__price">~${BY_NAME[n][5] * q}</span>'
            f'<a href="{escape(amazon_link(n))}" target="_blank" rel="sponsored nofollow noopener">Shop →</a></li>' for n, q in items)
        out.append(f'''          <article class="bk" id="kit-{kid}">
            <header><h3>{escape(name)}</h3><span class="bk__who">{escape(who)}</span></header>
            <ul>{rows}</ul>
            <p class="bk__total">Approx. total <strong>${kit_total(items):,}</strong></p>
            <p class="bk__note">{escape(note)}</p>
          </article>''')
    return "\n".join(out)


def page(root, *, full):
    index = (root / "index.html").read_text()
    head_links = index[index.index('<link rel="icon"'):index.index('<link rel="preload"')].strip()
    header = index[index.index('  <header class="site-header"'):index.index('  </header>') + len('  </header>')]
    for a in ("#calc", "#inside", "#kit", "#faq", "#buy"):
        header = header.replace(f'href="{a}"', f'href="/{a}"')
    header = header.replace('href="#top"', 'href="/"')
    # Absolute asset paths so the page works at /gear and /gear/kit.
    head_links = head_links.replace('href="assets/', 'href="/assets/')
    header = header.replace('src="assets/', 'src="/assets/')

    cats = []
    for i, (cid, title, blurb, items) in enumerate(PRODUCTS, 1):
        shown = items if full else [it for it in items if it[0] in TOP]
        cards = "\n".join(card(it, full) for it in shown)
        cats.append(f'''    <section class="gear-cat" id="{cid}">
      <div class="container">
        <header class="gear-cat__head">
          <p class="label reveal"><span class="label__n">{i:02d}</span><i class="label__rule"></i><span>{escape(title)}</span></p>
          <p class="gear-cat__blurb">{escape(blurb)}</p>
        </header>
        <div class="gear-grid{' gear-grid--top' if not full else ''}">
{cards}
        </div>
      </div>
    </section>''')

    jump = "\n".join(f'          <a href="#{cid}">{escape(t)}</a>' for cid, t, _, _ in PRODUCTS)
    if not full:
        tops = []
        for cid, title_c, _, items in PRODUCTS:
            for it in items:
                if it[0] in TOP:
                    tops.append(card((it[0], title_c, it[2], it[3], it[4], it[5]), False).replace('<span class="tag tag--orange">', '<span class="tag">').replace('<article class="gear-card">', f'<article class="gear-card" id="{cid}">'))
        cats = [f'''    <section class="gear-cat" id="picks">
      <div class="container">
        <header class="gear-cat__head">
          <p class="label reveal"><span class="label__n">08</span><i class="label__rule"></i><span>Top Picks</span></p>
          <p class="gear-cat__blurb">One trusted pick per category.</p>
        </header>
        <div class="gear-grid">
{chr(10).join(tops)}
        </div>
      </div>
    </section>''']
    if full:
        title = "Your Sonder Buy List — Sonder Protocol"
        robots = '<meta name="robots" content="noindex, nofollow" />'
        hero = f'''        <p class="pill reveal"><span class="pill__dot"></span>Blackout Kit · Buyer page</p>
        <h1 class="block__title reveal">Your Sonder Buy List.<br /><span class="muted">Every pick, how many, and in what order.</span></h1>
        <p class="gear-hero__sub reveal">The companion to your Buy List PDF. Start with a budget kit, or shop by category. Tier 1 first, then build out.</p>
        <p class="gear-disclosure reveal">{escape(DISCLOSURE)} {escape(PRICE_NOTE)}</p>
        <nav class="gear-jump reveal" aria-label="Sections">
          <a href="#budget">Budget kits</a>
{jump}
        </nav>'''
        budget = f'''    <section class="gear-cat" id="budget">
      <div class="container">
        <header class="gear-cat__head">
          <p class="label reveal"><span class="label__n">$</span><i class="label__rule"></i><span>Budget Kits</span></p>
          <p class="gear-cat__blurb">Pick your budget. Buy the list. Done.</p>
        </header>
        <div class="bks">
{budget_kits_html()}
        </div>
      </div>
    </section>
'''
        cta_head, cta_sub = 'Now put it to work.<br /><span class="shimmer">Follow the Playbook.</span>', "Your 30-Day Blackout Playbook tells you exactly how to use all of this, hour by hour."
        cta_btn = '<a href="/" class="btn btn--primary btn--lg shine">Back to Sonder Protocol <span class="btn__arrow">→</span></a>'
    else:
        title = "Emergency Gear We Recommend — Sonder Protocol"
        robots = ""
        hero = f'''        <p class="pill reveal"><span class="pill__dot"></span>The Sonder Gear List · Top Picks</p>
        <h1 class="block__title reveal">Gear we'd trust<br /><span class="muted">when the power goes out.</span></h1>
        <p class="gear-hero__sub reveal">Our top pick in every category. The full 34-item list, exact quantities, and $100 / $300 / $1,000 budget kits come with the Blackout Kit.</p>
        <p class="gear-disclosure reveal">{escape(DISCLOSURE)} Prices and availability are set by Amazon.</p>
        <nav class="gear-jump reveal" aria-label="Gear categories">
{jump}
        </nav>'''
        budget = ""
        cta_head, cta_sub = 'Want the full list?<br /><span class="shimmer">And what to do with it.</span>', "The Blackout Kit includes the full Sonder Buy List: 34 picks, quantities for your household, budget kits, and the order to buy in. Plus the 42-page Playbook."
        cta_btn = '<a href="/#buy" class="btn btn--primary btn--lg shine">Get the Blackout Kit <span class="btn__arrow">→</span></a>'

    return f'''<!doctype html>
<!-- GENERATED by tools/build_gear.py — edit PRODUCTS there, not this file. -->
<html lang="en" data-bonus="on">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(title)}</title>
  {robots}
  <meta name="description" content="Emergency preparedness gear Sonder Protocol recommends for power outages: water, light, radios, power, heat and CO safety, food, first aid, and sanitation." />
  <meta name="theme-color" content="#06080a" />
  {head_links}
  <link rel="stylesheet" href="/assets/css/styles.css" />
</head>
<body class="page-gear">
  <a class="skip-link" href="#main">Skip to content</a>

{header}

  <main id="main">
    <section class="gear-hero">
      <div class="aurora" aria-hidden="true"></div>
      <div class="grain" aria-hidden="true"></div>
      <div class="container gear-hero__inner">
{hero}
      </div>
    </section>

{budget}{chr(10).join(cats)}

    <section class="cta" id="buy">
      <div class="aurora" aria-hidden="true"></div>
      <div class="container cta__inner reveal">
        <p class="pill"><span class="pill__dot"></span>Protocol 001 · The Blackout Kit</p>
        <h2 class="cta__title">{cta_head}</h2>
        <p class="cta__sub">{cta_sub}</p>
        <div class="cta__form">{cta_btn}</div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container footer__base">
      <span>© <span data-year>2026</span> Sonder Protocol. {escape(DISCLOSURE)}</span>
      <span class="mono"><a href="/">Home</a> · <a href="/gear">Gear</a> · <a href="/live">Live Map</a></span>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js" defer></script>
  <script src="/assets/js/main.js" defer></script>
</body>
</html>
'''


def build():
    root = Path(__file__).resolve().parent.parent
    names = list(BY_NAME)
    assert not [k for k in ASINS if k not in BY_NAME], "ASINS key not in PRODUCTS"
    assert not [k for k in TOP if k not in BY_NAME], "TOP key not in PRODUCTS"
    for _, _, _, items, _ in BUDGET_KITS:
        for n, _ in items:
            assert BY_NAME[n][5], f"Budget kit item without price: {n}"
    (root / "gear.html").write_text(page(root, full=False))
    (root / "gear-kit.html").write_text(page(root, full=True))
    exact = sum(1 for n in names if n in ASINS)
    totals = ", ".join(f"{k[1]} ≈ ${kit_total(k[3]):,}" for k in BUDGET_KITS)
    print(f"gear.html: {len(TOP)} top picks · gear-kit.html: {len(names)} products ({exact} exact links) · {totals}")


if __name__ == "__main__":
    build()
