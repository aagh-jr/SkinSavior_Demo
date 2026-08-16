"""
cleanup_catalog.py
------------------
Removes catalogue rows that don't belong in a skincare ingredient index.

Two kinds, both list-only unless --delete is passed:

  channel/gift  Brands publish a separate storefront entry per sales channel,
                and the imagery is promotional rather than the product —
                "[Amazon] DIVE IN Serum" carried a before/after composite,
                "[FreeGift] ... 10ml" a gift graphic. Each duplicates a
                product already present under its proper name.

  makeup        Colour cosmetics (--makeup). A concealer's INCI list is real,
                but nobody checks it for retinoid clashes, and shade variants
                multiply into dozens of near-identical rows. Present from both
                sources: the brand import (Kosas, TIRTIR) and the original
                Open Beauty Facts seed (Rimmel BB creams, nail polish remover).

Both are filtered at import time now; this clears what landed before that.
Deletion cascades to product_ingredients via the foreign key.

Usage
-----
  python scripts/cleanup_catalog.py                      # list channel/gift
  python scripts/cleanup_catalog.py --makeup             # list both
  set SUPABASE_SERVICE_KEY=eyJ...
  python scripts/cleanup_catalog.py --makeup --delete    # remove
"""

import argparse
import io
import os
import re
import sys
import urllib.parse

# Catalogue names carry characters the Windows console codepage can't encode
# (zero-width joiners, accented French labels from the Open Beauty Facts seed).
# Without this the script dies mid-listing on a printing error rather than
# anything to do with the data.
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_popular_products import SESSION, SUPABASE_URL, preflight  # noqa: E402

SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip().strip('"').strip("'").strip()

ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdHZjbGh4"
    "cmpyb2Vjam51Z3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjQxOTIsImV4cCI6MjA5NDU0MDE5Mn0"
    ".EQ_ZfnXwXB4oR_4mauODpiTTKrFSa8hv-EF5RudupoQ"
)

# A leading bracketed tag ("[Amazon] ...", "[FreeGift] ..."), or a channel /
# gift keyword anywhere in the name.
CHANNEL_LISTING = re.compile(
    r"^\s*[\[\(][^\]\)]{2,20}[\]\)]"
    r"|\b(gwp|amazon|qoo10|shopee|lazada|freegift|free gift|costco|walmart)\b",
    re.I,
)

# Colour cosmetics. "teint" and "maquillage" catch the French-labelled rows
# from the Open Beauty Facts seed.
MAKEUP = re.compile(
    r"\b(concealer|foundation|cushion|lipstick|lip tint|lip gloss|lip oil|"
    r"lip stain|mascara|eyeliner|eye liner|eyeshadow|eye shadow|blush|"
    r"bronzer|contour|highlighter|brow|setting (spray|powder)|primer|"
    r"bb cream|cc cream|tinted moisturi[sz]er|palette|nail|glitter|lash|"
    r"teint|maquillage|vernis)\b",
    re.I,
)

# Physical objects and out-of-scope categories, not skincare formulations.
# Brand stores sell these alongside their products: "Dieux Squeeze Key" is a
# tube squeezer, "Bojagi" a wrapping cloth, "Bubble Charms" merch. Hair, body
# and deodorant are real formulations but out of scope for a face index.
NOT_SKINCARE = re.compile(
    r"\b(squeeze key|spatula|hair clip|clips?|headband|scrunchie|charms?|"
    r"applicator|sponge|puff|roller|gua sha|device|lamp|mirror|tote|"
    r"keychain|bojagi|cloth|towel|case|holder|stand|tray|dish|"
    r"shampoo|conditioner|hair (bonding|treatment|mask|oil|serum)|"
    r"body (wash|lotion|scrub|oil|polish|butter|skin)|deodorant|"
    r"hand cream|foot)\b",
    re.I,
)


def bundle_titles_by_brand() -> dict:
    """
    Titles each brand's storefront marks as a multi-product set.

    Bundles can't be found from our own rows: we don't store Shopify's
    product_type (ours holds a derived category), and the title alone is
    unreliable in both directions — "The Glow Ritual" is a bundle with no
    set-like word, while "Effaclar Duo" is an ordinary product with one. So
    ask the source, which says it plainly.
    """
    from import_brand_catalogs import BRAND_DOMAINS, BRAND_NAMES, fetch_catalog, is_bundle

    out: dict[str, set] = {}
    for key, domain in BRAND_DOMAINS.items():
        catalog = fetch_catalog(domain)
        if not catalog:
            print(f"  (couldn't reach {domain} — skipping {key})")
            continue
        brand = BRAND_NAMES.get(key, key)
        titles = {
            re.sub(r"[^a-z0-9]+", " ", (p.get("title") or "").lower()).strip()
            for p in catalog
            if is_bundle(p)
        }
        titles.discard("")
        if titles:
            out[brand.lower()] = titles
    return out


def load_products(key: str) -> list:
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    base = f"{SUPABASE_URL}/rest/v1"
    rows, offset = [], 0
    while True:
        r = SESSION.get(
            f"{base}/products?select=id,brand,name,slug&limit=1000&offset={offset}",
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--delete", action="store_true", help="perform the deletion")
    ap.add_argument("--makeup", action="store_true",
                    help="also remove colour cosmetics (concealer, BB cream, nail, ...)")
    ap.add_argument("--not-skincare", action="store_true",
                    help="also remove accessories, hair, body and deodorant")
    ap.add_argument("--bundles", action="store_true",
                    help="also remove multi-product sets (re-checks brand storefronts)")
    args = ap.parse_args()

    if args.delete and not SERVICE_KEY:
        sys.exit(
            "SUPABASE_SERVICE_KEY is not set — deleting needs it.\n"
            "  cmd: set SUPABASE_SERVICE_KEY=eyJ...\n"
            "Run without --delete to list what would go."
        )
    if args.delete:
        preflight(SERVICE_KEY)

    key = SERVICE_KEY if args.delete else ANON_KEY
    rows = load_products(key)

    patterns = [("channel/gift", CHANNEL_LISTING)]
    if args.makeup:
        patterns.append(("makeup", MAKEUP))
    if args.not_skincare:
        patterns.append(("not skincare", NOT_SKINCARE))

    # First matching pattern wins, so nothing is listed or deleted twice.
    targets, reason = [], {}
    for label, pattern in patterns:
        for row in rows:
            if row["id"] in reason:
                continue
            if pattern.search(row.get("name") or ""):
                targets.append(row)
                reason[row["id"]] = label

    # Bundles are matched against the brand storefronts, not by name — our
    # rows don't carry Shopify's product_type, and names are unreliable here.
    if args.bundles:
        print("Checking brand storefronts for multi-product sets…")
        by_brand = bundle_titles_by_brand()
        for row in rows:
            if row["id"] in reason:
                continue
            titles = by_brand.get((row.get("brand") or "").strip().lower())
            if not titles:
                continue
            name = re.sub(r"[^a-z0-9]+", " ", (row.get("name") or "").lower()).strip()
            if name in titles:
                targets.append(row)
                reason[row["id"]] = "bundle"
        print()

    print(f"{len(rows)} products scanned — {len(targets)} to remove\n")
    for t in targets:
        print(f"  [{reason[t['id']]:<12}] {t['brand'][:18]:<18} {t['name'][:48]}")

    if not targets:
        print("Nothing to clean up.")
        return

    if not args.delete:
        print("\nList only. Re-run with --delete (and SUPABASE_SERVICE_KEY set) to remove these.")
        if not args.makeup:
            print("Add --makeup to include colour cosmetics.")
        if not args.not_skincare:
            print("Add --not-skincare to include accessories, hair, body and deodorant.")
        if not args.bundles:
            print("Add --bundles to include multi-product sets.")
        return

    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Prefer": "return=minimal"}
    removed = 0
    for t in targets:
        resp = SESSION.delete(
            f"{SUPABASE_URL}/rest/v1/products?id=eq.{urllib.parse.quote(t['id'])}",
            headers=headers, timeout=30,
        )
        if resp.status_code < 300:
            removed += 1
        else:
            print(f"  failed: {t['name'][:44]} -> {resp.status_code} {resp.text[:90]}")

    print(f"\nDeleted {removed} of {len(targets)}.")


if __name__ == "__main__":
    main()
