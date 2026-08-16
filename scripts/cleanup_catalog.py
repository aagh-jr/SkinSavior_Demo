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
import os
import re
import sys
import urllib.parse

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

    # First matching pattern wins, so nothing is listed or deleted twice.
    targets, reason = [], {}
    for label, pattern in patterns:
        for row in rows:
            if row["id"] in reason:
                continue
            if pattern.search(row.get("name") or ""):
                targets.append(row)
                reason[row["id"]] = label

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
