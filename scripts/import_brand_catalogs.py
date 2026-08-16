"""
import_brand_catalogs.py
------------------------
Imports whole brand catalogues from their own Shopify storefronts.

WHY THIS EXISTS
The catalogue was seeded from Open Beauty Facts, which is crowd-sourced: 571
of 740 images were phone photos of bottles on kitchen counters. Brands publish
proper studio photography on their own sites, and Shopify exposes every
storefront's catalogue at a public, documented endpoint:

    https://{brand-domain}/products.json?limit=250&page=N

That gives name, brand, professional image, price and description straight
from the source. It does NOT give ingredient lists (measured: 0-5 products per
brand carry INCI in body_html), so INCI still comes from INCIDecoder, as in
fetch_popular_products.py.

Products WITHOUT an ingredient list are skipped by default. Match scoring and
clash detection both need INCI — a product we can't score is padding in a
catalogue whose whole promise is ingredient transparency. Pass
--allow-missing-inci to override.

Measured yield: ~39% of filtered products are found on INCIDecoder, so expect
roughly 600 keepers from ~1,500 candidates across the 22 brands below.

Usage
-----
  python scripts/import_brand_catalogs.py --dry-run --brands cosrx,anua
  python scripts/import_brand_catalogs.py --dry-run          # all brands
  set SUPABASE_SERVICE_KEY=eyJ...
  python scripts/import_brand_catalogs.py                    # write

Safe to re-run: existing products are matched and enriched, not duplicated.
"""

import argparse
import os
import re
import sys
import time
import unicodedata
import urllib.parse

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_popular_products import (  # noqa: E402
    Db,
    preflight,
    scrape_incidecoder,
    slugify,
    SUPABASE_URL,  # noqa: F401  (kept for parity/readability)
)

SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip().strip('"').strip("'").strip()

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# Canonical brand names.
#
# Shopify's `vendor` field is free text and frequently carries storefront
# cruft — COSRX ships "COSRX official", others use "<Brand> US" or "<Brand>
# Global". That extra word breaks the INCIDecoder search: querying
# "COSRX official BHA Blackhead Power Liquid" finds nothing while
# "COSRX BHA Blackhead Power Liquid" returns the product. This is also what
# users see as the brand, so it needs to be right regardless.
BRAND_NAMES = {
    "cosrx": "COSRX",
    "beautyofjoseon": "Beauty of Joseon",
    "anua": "Anua",
    "skin1004": "SKIN1004",
    "torriden": "Torriden",
    "axisy": "Axis-Y",
    "mixsoon": "mixsoon",
    "medicube": "medicube",
    "tirtir": "TIRTIR",
    "innisfree": "Innisfree",
    "glowrecipe": "Glow Recipe",
    "summerfridays": "Summer Fridays",
    "farmacy": "Farmacy",
    "tatcha": "Tatcha",
    "sundayriley": "Sunday Riley",
    "versed": "Versed",
    "bubble": "Bubble",
    "naturium": "Naturium",
    "byoma": "BYOMA",
    "inkeylist": "The INKEY List",
    "dieux": "Dieux",
    "kosas": "Kosas",
}

# Verified Shopify storefronts. Keys double as the --brands filter.
BRAND_DOMAINS = {
    "cosrx": "cosrx.com",
    "beautyofjoseon": "beautyofjoseon.com",
    "anua": "anua.us",
    "skin1004": "skin1004.com",
    "torriden": "torriden.us",
    "axisy": "axis-y.com",
    "mixsoon": "mixsoon.us",
    "medicube": "medicube.us",
    "tirtir": "tirtir.us",
    "innisfree": "us.innisfree.com",
    "glowrecipe": "www.glowrecipe.com",
    "summerfridays": "summerfridays.com",
    "farmacy": "www.farmacybeauty.com",
    "tatcha": "www.tatcha.com",
    "sundayriley": "sundayriley.com",
    "versed": "versedskin.com",
    "bubble": "bubbleskincare.com",
    "naturium": "naturium.com",
    "byoma": "byoma.com",
    "inkeylist": "theinkeylist.com",
    "dieux": "dieuxskin.com",
    "kosas": "kosas.com",
}

# Brand catalogues carry a lot that isn't a skincare product: bundles, gifts,
# tools, merch. Importing those would inflate the count without adding
# anything scoreable.
SKIP_TITLE = re.compile(
    r"\b(bundle|set|kit|gift|sample|trial|tool|brush|headband|towel|merch|"
    r"sticker|pouch|bag|refill|duo|trio|freegift|hidden|card|voucher|"
    r"e-?gift|subscription|mystery|"
    # Collection/landing entries masquerading as products. Caught here rather
    # than left to the no-INCI gate: every one that reaches INCIDecoder costs
    # a ~1.2s lookup that can only ever miss.
    r"routine|essentials|bestsellers|favou?rites|collection|pack|value|"
    r"starter|discovery|limited edition|"
    # Size variants duplicate a full-size product we already import, and
    # INCIDecoder indexes the full size rather than the travel one.
    r"travel size|mini|deluxe size|sachet)\b",
    re.I,
)

# Body/hair products — out of scope for a face-focused index.
SKIP_BODY = re.compile(r"\b(body wash|body lotion|body scrub|shampoo|conditioner|hand cream|foot)\b", re.I)

# INCIDecoder politeness. Raised from 1.15s after a real import run: at that
# rate the site began refusing requests partway through, and because a refused
# request looked identical to "product not indexed", valid products were being
# dropped. Slower is cheaper than a catalogue full of false misses.
SLEEP_INCI = 2.0

# Backoff schedule when a request is refused outright. Generous on purpose —
# throttling clears with time, and giving up early loses real products.
INCI_BACKOFF = (5.0, 15.0, 40.0)


def search_terms(brand: str, title: str) -> list[str]:
    """
    Queries to try against INCIDecoder, best first.

    Titles sometimes already contain the brand ("COSRX Azelaic Acid 20 B5"),
    so prefixing it again produces a doubled query that matches nothing. And
    when brand + title misses, the title alone often hits — INCIDecoder's
    naming doesn't always agree with the brand's storefront.
    """
    title = title.strip()
    brand = brand.strip()
    terms = []
    if brand and not title.lower().startswith(brand.lower()):
        terms.append(f"{brand} {title}")
    terms.append(title)
    # Parenthetical suffixes ("(SPF50+ PA++++)") are marketing, and rarely
    # part of how INCIDecoder titles the product.
    bare = re.sub(r"\s*[\(\[][^)\]]*[\)\]]", "", title).strip()
    if bare and bare != title:
        terms.append(f"{brand} {bare}".strip())
    seen, out = set(), []
    for t in terms:
        k = t.lower()
        if k not in seen:
            seen.add(k)
            out.append(t)
    return out


def lookup_inci(brand: str, title: str) -> dict:
    """
    INCIDecoder lookup that tells throttling apart from a genuine miss, and
    tries more than one phrasing before giving up.

    scrape_incidecoder() flags a failed request with `_fetch_failed`; an empty
    result WITHOUT that flag means that query found nothing, which retrying
    won't change — but a DIFFERENT query might still hit.
    """
    last: dict = {}
    for term in search_terms(brand, title):
        result = scrape_incidecoder(term)
        time.sleep(SLEEP_INCI)

        for wait in INCI_BACKOFF:
            if not result.get("_fetch_failed"):
                break
            time.sleep(wait)
            result = scrape_incidecoder(term)
            time.sleep(SLEEP_INCI)

        if result.get("ingredients"):
            return result
        last = result
        if result.get("_fetch_failed"):
            # Still blocked after full backoff; further phrasings won't fare
            # better and would just prolong the throttle.
            return result
    return last


def make_session() -> requests.Session:
    s = requests.Session()
    retry = Retry(total=4, backoff_factor=1.5,
                  status_forcelist=(429, 500, 502, 503, 504),
                  allowed_methods=("GET", "POST", "PATCH", "DELETE"))
    ad = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=20)
    s.mount("https://", ad)
    s.mount("http://", ad)
    return s


SESSION = make_session()


def fetch_catalog(domain: str, max_pages: int = 6) -> list:
    """Every product on a Shopify storefront, paginated."""
    out = []
    for page in range(1, max_pages + 1):
        url = f"https://{domain}/products.json?limit=250&page={page}"
        try:
            r = SESSION.get(url, headers={"User-Agent": UA, "Accept": "application/json"}, timeout=25)
            if r.status_code != 200:
                break
            products = r.json().get("products", [])
        except Exception:
            break
        if not products:
            break
        out.extend(products)
        if len(products) < 250:
            break
    return out


def best_image(product: dict) -> str | None:
    """Highest-resolution image Shopify will serve for this product."""
    images = product.get("images") or []
    if not images:
        return None
    src = images[0].get("src")
    if not isinstance(src, str):
        return None
    src = src.split("?")[0]
    # Shopify sizes live in the filename; 1200 is sharp without being huge.
    return re.sub(r"_(\d+)x(\d+)?(\.[a-z]+)$", r"_1200x1200\3", src)


def clean_text(html: str | None, limit: int = 600) -> str | None:
    if not html:
        return None
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit] or None


def guess_category(product: dict) -> str | None:
    """
    Map a Shopify product to our canonical vocabulary.

    product_type is unreliable across brands (mixed languages, 'Custom
    Bundle', empty), so the title is the primary signal — it's what the
    canonical_category generated column keys off anyway.
    """
    hay = f"{product.get('title','')} {product.get('product_type','')} {product.get('tags','')}".lower()
    checks = [
        ("Sunscreen", r"\b(sunscreen|sun stick|sun serum|sun cream|spf|suncream|sun milk)\b"),
        ("Cleanser", r"\b(cleanser|cleansing|face wash|foam|micellar|makeup remover)\b"),
        ("Toner", r"\btoner|toning\b"),
        ("Essence", r"\b(essence|ampoule)\b"),
        ("Serum", r"\b(serum|booster|drops)\b"),
        ("Eye Cream", r"\beye (cream|serum|patch)\b"),
        ("Mask", r"\b(mask|masque|sleeping pack)\b"),
        ("Exfoliant", r"\b(exfoliant|peel|peeling|aha|bha|pha|pad)\b"),
        ("Oil", r"\b(face oil|facial oil)\b"),
        ("Moisturizer", r"\b(moisturi[sz]er|cream|lotion|gel cream|balm|emulsion)\b"),
    ]
    for label, pattern in checks:
        if re.search(pattern, hay):
            return label
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--brands", default="", help="comma-separated keys from BRAND_DOMAINS")
    ap.add_argument("--limit-per-brand", type=int, default=0)
    ap.add_argument("--allow-missing-inci", action="store_true",
                    help="import products we can't find an ingredient list for")
    args = ap.parse_args()

    keys = [k.strip() for k in args.brands.split(",") if k.strip()] or list(BRAND_DOMAINS)
    unknown = [k for k in keys if k not in BRAND_DOMAINS]
    if unknown:
        sys.exit(f"Unknown brand key(s): {', '.join(unknown)}\nKnown: {', '.join(BRAND_DOMAINS)}")

    db = None
    if not args.dry_run:
        if not SERVICE_KEY:
            sys.exit(
                "SUPABASE_SERVICE_KEY is not set.\n"
                "  cmd:        set SUPABASE_SERVICE_KEY=eyJ...\n"
                "  PowerShell: $env:SUPABASE_SERVICE_KEY=\"eyJ...\"\n"
                "Or use --dry-run."
            )
        preflight(SERVICE_KEY)
        db = Db(SERVICE_KEY)

    added = enriched = skipped_noinci = skipped_filter = failed = throttled = 0

    for key in keys:
        domain = BRAND_DOMAINS[key]
        catalog = fetch_catalog(domain)
        if not catalog:
            print(f"\n-- {key}: catalogue unavailable")
            continue

        # Shopify storefronts list the same product several times (per
        # collection, per region, per variant grouping). Deduplicate on the
        # normalised title BEFORE any INCIDecoder lookup — otherwise the same
        # product is queried repeatedly, which both wastes requests and
        # invites the throttling that made identical queries return different
        # answers.
        candidates = []
        seen_titles: set[str] = set()
        for p in catalog:
            title = (p.get("title") or "").strip()
            if not title or SKIP_TITLE.search(title) or SKIP_BODY.search(title):
                skipped_filter += 1
                continue
            if not p.get("images"):
                skipped_filter += 1
                continue
            # NB: not `key` — that's the brand loop variable, and shadowing it
            # renamed the brand in the progress output.
            title_key = re.sub(r"[^a-z0-9]+", " ", title.lower()).strip()
            if title_key in seen_titles:
                skipped_filter += 1
                continue
            seen_titles.add(title_key)
            candidates.append(p)

        if args.limit_per_brand:
            candidates = candidates[: args.limit_per_brand]

        print(f"\n-- {key} ({domain}): {len(catalog)} in catalogue, {len(candidates)} skincare candidates")

        for p in candidates:
            title = p["title"].strip()
            # Canonical name, NOT Shopify's vendor field — see BRAND_NAMES.
            brand = BRAND_NAMES.get(key) or (p.get("vendor") or key).strip()
            label = f"{brand} {title}"

            inci = lookup_inci(brand, title)
            ingredients = inci.get("ingredients", [])
            if inci.get("_fetch_failed"):
                # Exhausted the backoff and INCIDecoder is still refusing. Do
                # NOT record this as "no ingredients" — that's the silent data
                # loss this whole retry path exists to prevent.
                throttled += 1
                print(f"   THROTTLED  {title[:48]}  (skipped, retry this brand later)")
                continue

            if not ingredients and not args.allow_missing_inci:
                skipped_noinci += 1
                print(f"   skip  {title[:56]}  (no INCI)")
                continue

            image = best_image(p)
            price = None
            variants = p.get("variants") or []
            if variants and variants[0].get("price"):
                try:
                    price = f"${float(variants[0]['price']):.2f}"
                except (TypeError, ValueError):
                    pass

            print(f"   ok    {title[:50]:<50} {len(ingredients):3} ing  {price or ''}")

            if args.dry_run:
                added += 1
                continue

            slug = slugify(label)
            try:
                existing = db.find_product(slug, brand, title)
                ing_ids = []
                if ingredients:
                    for name in ingredients:
                        try:
                            ing_ids.append(db.ingredient_id(name))
                        except Exception:
                            pass

                if existing:
                    patch = {"category": guess_category(p), "product_type": guess_category(p)}
                    # Brand studio photo always beats a crowd-sourced one.
                    if image:
                        patch["image_url"] = image
                    if price:
                        patch["price"] = price
                    if ingredients:
                        patch["raw_ingredients"] = ", ".join(ingredients)
                    desc = clean_text(p.get("body_html"))
                    if desc:
                        patch["description"] = desc
                    db.patch_product(existing, {k: v for k, v in patch.items() if v is not None})
                    if ing_ids:
                        db.link_ingredients(existing, ing_ids, replace=True)
                    enriched += 1
                else:
                    row = {
                        "brand": brand,
                        "name": title,
                        "slug": slug,
                        "category": guess_category(p),
                        "product_type": guess_category(p),
                        "image_url": image,
                        "price": price,
                        "description": clean_text(p.get("body_html")),
                        "source": "seed",
                        "raw_ingredients": ", ".join(ingredients) if ingredients else None,
                    }
                    pid = db.insert_product({k: v for k, v in row.items() if v is not None})
                    if ing_ids:
                        db.link_ingredients(pid, ing_ids)
                    added += 1
            except Exception as e:
                failed += 1
                print(f"         DB error: {str(e)[:110]}")

    print("\n" + "=" * 62)
    verb = "would add" if args.dry_run else "added"
    print(f"{verb}: {added} | enriched: {enriched} | no INCI: {skipped_noinci} "
          f"| filtered out: {skipped_filter} | failed: {failed}")
    if throttled:
        print(f"\nTHROTTLED: {throttled} product(s) were refused by INCIDecoder "
              "and skipped.")
        print("These are NOT confirmed missing — re-run this brand later to pick them up.")


if __name__ == "__main__":
    main()
