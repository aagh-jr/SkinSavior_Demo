"""
cleanup_channel_listings.py
---------------------------
Removes channel-specific and gift-with-purchase listings that the first brand
import let through.

Brands publish a separate storefront entry per sales channel, and their
imagery is promotional rather than the product — "[Amazon] DIVE IN Serum"
carries a before/after composite, "[FreeGift] ... 10ml" a GWP graphic. Each is
a DUPLICATE of a product already in the catalogue under its proper name, so
deleting them loses no product, only the bad copy.

import_brand_catalogs.py now filters these at import time; this cleans up the
ones imported before that fix.

Deletion cascades to product_ingredients via the foreign key, so ingredient
links go with them. Nothing else references products by id.

Usage
-----
  python scripts/cleanup_channel_listings.py                 # list only
  set SUPABASE_SERVICE_KEY=eyJ...
  python scripts/cleanup_channel_listings.py --delete        # actually remove
"""

import argparse
import os
import re
import sys
import urllib.parse

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_popular_products import SESSION, SUPABASE_URL, preflight  # noqa: E402

SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip().strip('"').strip("'").strip()

# A leading bracketed tag ("[Amazon] ...", "[FreeGift] ..."), or a channel /
# gift keyword anywhere in the name.
CHANNEL_LISTING = re.compile(
    r"^\s*[\[\(][^\]\)]{2,20}[\]\)]"
    r"|\b(gwp|amazon|qoo10|shopee|lazada|freegift|free gift|costco|walmart)\b",
    re.I,
)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--delete", action="store_true", help="perform the deletion")
    args = ap.parse_args()

    anon = (
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdHZjbGh4"
        "cmpyb2Vjam51Z3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjQxOTIsImV4cCI6MjA5NDU0MDE5Mn0"
        ".EQ_ZfnXwXB4oR_4mauODpiTTKrFSa8hv-EF5RudupoQ"
    )
    key = SERVICE_KEY if args.delete else anon
    if args.delete and not SERVICE_KEY:
        sys.exit(
            "SUPABASE_SERVICE_KEY is not set — deleting needs it.\n"
            "  cmd: set SUPABASE_SERVICE_KEY=eyJ...\n"
            "Run without --delete to list what would go."
        )
    if args.delete:
        preflight(SERVICE_KEY)

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

    targets = [x for x in rows if CHANNEL_LISTING.search(x.get("name") or "")]
    print(f"{len(rows)} products scanned — {len(targets)} channel/gift listings\n")
    for t in targets:
        print(f"  {t['brand'][:20]:<20} {t['name'][:56]}")

    if not targets:
        print("\nNothing to clean up.")
        return

    if not args.delete:
        print("\nList only. Re-run with --delete (and SUPABASE_SERVICE_KEY set) to remove these.")
        return

    removed = 0
    for t in targets:
        resp = SESSION.delete(
            f"{base}/products?id=eq.{urllib.parse.quote(t['id'])}",
            headers={**headers, "Prefer": "return=minimal"},
            timeout=30,
        )
        if resp.status_code < 300:
            removed += 1
        else:
            print(f"  failed: {t['name'][:44]} -> {resp.status_code} {resp.text[:90]}")

    print(f"\nDeleted {removed} of {len(targets)}.")


if __name__ == "__main__":
    main()
