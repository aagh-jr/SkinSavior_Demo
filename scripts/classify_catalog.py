"""
classify_catalog.py
-------------------
Flags out-of-scope catalogue rows by setting products.excluded_reason.

Nothing is deleted. Excluded products stay in the database but are filtered
out of every catalogue query, so the decision is reversible and a re-import
can't silently resurrect them.

WHY TITLES AREN'T ENOUGH
Brand storefronts sell makeup and tools alongside skincare, and the titles
give nothing away: Kosas ships "Hotliner", "Soulgazer" and "Shiny Objects";
Versed ships "Face Perfector" and "Smooth Finish". Shopify's product_type is
descriptive where the title isn't —

    Hotliner        -> "lip liner"
    Shiny Objects   -> "mascara"
    Face Perfector  -> "Dual-Ended Complexion Brush"
    Smooth Finish   -> "Brightening Setting Powder"

so classification re-reads the storefronts and matches on type first, falling
back to the title for products we hold from other sources.

Usage
-----
  python scripts/classify_catalog.py                 # report only
  set SUPABASE_SERVICE_KEY=eyJ...
  python scripts/classify_catalog.py --write
  python scripts/classify_catalog.py --write --clear  # reset all flags first
"""

import argparse
import io
import os
import re
import sys
import urllib.parse

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_popular_products import SESSION, SUPABASE_URL, preflight  # noqa: E402
from import_brand_catalogs import BRAND_DOMAINS, BRAND_NAMES, fetch_catalog, is_bundle  # noqa: E402

# Brands we no longer IMPORT but whose products are still in the catalogue.
# Their storefronts are still the only place to learn that "Hotliner" is a lip
# liner and "Shiny Objects" is a mascara, so classification still reads them.
CLASSIFY_ONLY_DOMAINS = {"kosas": "kosas.com"}
CLASSIFY_ONLY_NAMES = {"kosas": "Kosas"}

SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip().strip('"').strip("'").strip()
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdHZjbGh4"
    "cmpyb2Vjam51Z3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjQxOTIsImV4cCI6MjA5NDU0MDE5Mn0"
    ".EQ_ZfnXwXB4oR_4mauODpiTTKrFSa8hv-EF5RudupoQ"
)

# Removers are CLEANSERS even though "makeup" is in the name — checked first
# so "Green Clean Makeup Meltaway Cleansing Balm" and "Oil-Free Eye-Makeup
# Remover" stay in the catalogue.
NOT_MAKEUP = re.compile(r"\b(remover|removing|meltaway|melting balm|cleansing (balm|oil|water|cloth|cream))\b", re.I)

# Matched against product_type AND title.
MAKEUP = re.compile(
    r"\b(concealer|foundation|cushion|lipstick|lip ?(liner|colou?r|gloss|tint|stain|"
    r"balm|treatment|serum|blush|scrub|mask|pulse|fuel|booster)|mascara|eye ?liner|"
    r"eye ?shadow|blush|bronzer|contour|highlight|illuminating stick|brow|lash|"
    r"setting (powder|spray)|primer|bb cream|cc cream|skin tint|tinted moisturi[sz]er|"
    r"palette|nail|glitter|multistick|wet stick|washes of colou?r|complexion colou?r|"
    r"makeup|teint|maquillage|vernis)\b",
    re.I,
)

ACCESSORY = re.compile(
    r"\b(brush|spatula|dermaplaning|headband|scrunchie|charms?|hair clip|clips?|"
    r"applicator|sponge|puff|roller|gua sha|device|tool|lamp|mirror|tote|"
    # "bag" and "cloth" removed: both appear as PACKAGING or FORM descriptors
    # on real products ("Detox Soap - Bag", "cleansing cloths"). A merch bag is
    # still caught by "merch" or "tote".
    r"keychain|merch|gift ?(card|wrap)|bojagi|towel|case|holder|stand|tray)\b",
    re.I,
)

BODY_HAIR = re.compile(
    r"\b(body ?(wash|lotion|scrub|oil|polish|butter|smoothing|skin)|bodywash|"
    r"shampoo|conditioner|hair ?(bonding|treatment|mask|oil|serum|care)|"
    r"hand cream|foot|deodorant)\b",
    re.I,
)

CHANNEL = re.compile(
    r"^\s*[\[\(][^\]\)]{2,20}[\]\)]"
    r"|\b(gwp|amazon|qoo10|shopee|lazada|freegift|free gift|costco|walmart|wholesale)\b",
    re.I,
)


def classify(title: str, product_type: str, tags, is_set: bool) -> str | None:
    """First matching rule wins; order reflects how confident each signal is."""
    if is_set:
        return "bundle"
    hay = f"{product_type} || {title}"
    if CHANNEL.search(title) or CHANNEL.search(product_type):
        return "channel_listing"
    if ACCESSORY.search(hay):
        return "accessory"
    if MAKEUP.search(hay) and not NOT_MAKEUP.search(hay):
        return "makeup"
    if BODY_HAIR.search(hay):
        return "body_hair"
    return None


def fetch_all(key: str, path: str) -> list:
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    rows, offset = [], 0
    while True:
        r = SESSION.get(
            f"{SUPABASE_URL}/rest/v1/{path}&limit=1000&offset={offset}",
            headers=headers, timeout=45,
        )
        r.raise_for_status()
        page = r.json()
        if not page:
            break
        rows += page
        offset += 1000
        if len(page) < 1000:
            break
    return rows


def norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--clear", action="store_true", help="reset every flag before classifying")
    args = ap.parse_args()

    if args.write and not SERVICE_KEY:
        sys.exit("SUPABASE_SERVICE_KEY is not set.\n  cmd: set SUPABASE_SERVICE_KEY=eyJ...")
    if args.write:
        preflight(SERVICE_KEY)
    key = SERVICE_KEY if args.write else ANON_KEY

    # excluded_reason is deliberately not selected: the report must work
    # before the migration is applied, and it is only ever written, never read.
    products = fetch_all(key, "products?select=id,brand,name")
    links = fetch_all(key, "product_ingredients?select=product_id")
    linked = {row["product_id"] for row in links}

    # Storefront metadata, keyed by (brand, normalised title).
    print("Reading brand storefronts for product types…")
    meta: dict = {}
    for bkey, domain in {**BRAND_DOMAINS, **CLASSIFY_ONLY_DOMAINS}.items():
        catalog = fetch_catalog(domain)
        if not catalog:
            print(f"  (unreachable: {domain})")
            continue
        brand = {**BRAND_NAMES, **CLASSIFY_ONLY_NAMES}.get(bkey, bkey).lower()
        for p in catalog:
            meta[(brand, norm(p.get("title", "")))] = (
                str(p.get("product_type") or ""),
                p.get("tags") or [],
                is_bundle(p),
            )
    print(f"  {len(meta)} storefront entries\n")

    decisions: dict = {}
    for p in products:
        brand = (p.get("brand") or "").strip().lower()
        ptype, tags, is_set = meta.get((brand, norm(p.get("name", ""))), ("", [], False))
        reason = classify(p.get("name", ""), ptype, tags, is_set)
        # No ingredients means nothing to analyse — the one rule that doesn't
        # depend on what kind of product it is.
        if reason is None and p["id"] not in linked:
            reason = "no_ingredients"
        if reason:
            decisions[p["id"]] = reason

    from collections import Counter
    counts = Counter(decisions.values())
    visible = len(products) - len(decisions)
    print(f"{len(products)} products")
    print(f"  {visible} visible")
    print(f"  {len(decisions)} excluded:")
    for reason, n in counts.most_common():
        print(f"     {n:5}  {reason}")

    by_reason: dict = {}
    for p in products:
        r = decisions.get(p["id"])
        if r:
            by_reason.setdefault(r, []).append(p)
    for reason, items in by_reason.items():
        print(f"\n  --- {reason} (first 8 of {len(items)}) ---")
        for p in items[:8]:
            print(f"     {(p['brand'] or '?')[:16]:<16} {p['name'][:46]}")

    if not args.write:
        print("\nReport only. Re-run with --write (and SUPABASE_SERVICE_KEY) to apply.")
        return

    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    if args.clear:
        SESSION.patch(
            f"{SUPABASE_URL}/rest/v1/products?excluded_reason=not.is.null",
            headers=headers, json={"excluded_reason": None}, timeout=45,
        )
        print("\nCleared existing flags.")

    applied = 0
    for pid, reason in decisions.items():
        resp = SESSION.patch(
            f"{SUPABASE_URL}/rest/v1/products?id=eq.{urllib.parse.quote(pid)}",
            headers=headers, json={"excluded_reason": reason}, timeout=30,
        )
        if resp.status_code < 300:
            applied += 1
        else:
            print(f"  failed {pid}: {resp.status_code} {resp.text[:80]}")
    print(f"\nFlagged {applied} of {len(decisions)} products.")


if __name__ == "__main__":
    main()
