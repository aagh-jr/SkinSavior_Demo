"""
recategorize.py
---------------
Recomputes products.category for Shopify-sourced rows using the corrected
guess_category(), and reports every change before applying any.

WHY
guess_category() used to fold Shopify `tags` into its haystack. Tags are
merchandising metadata, not product typing, and they poisoned the result:
Innisfree's Green Tea Ceramide Plump Cream ranked #1 in "Sunscreens" because
it carries the gift-with-purchase tag 'free mini spf w/moisturizer'. Cocokind's
watermelon hemp oil landed there on 'NO CHEMICAL SUNSCREEN' -- a claim that the
product contains none.

Miscategorisation is not cosmetic here. /for-you ranks within a category, so a
moisturizer in Sunscreens is recommended to someone shopping for sun
protection, which is a safety-adjacent failure: they may believe they are
covered when nothing in the product protects them.

Only rows whose title matches a live storefront listing are touched. Anything
seeded from Open Beauty Facts is left alone -- there is no product_type for it,
so this script has nothing better to offer than what is already stored.

Usage
-----
  python scripts/run_import.py recategorize.py               # report
  python scripts/run_import.py recategorize.py --write
"""

import argparse
import os
import re
import sys
import urllib.parse
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_popular_products import SESSION, SUPABASE_URL, preflight  # noqa: E402
from classify_catalog import ANON_KEY, fetch_all  # noqa: E402
from import_brand_catalogs import (  # noqa: E402
    BRAND_DOMAINS, BRAND_NAMES, fetch_catalog, guess_category,
)

SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip().strip('"').strip("'").strip()


def norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    if args.write and not SERVICE_KEY:
        sys.exit("SUPABASE_SERVICE_KEY is not set. Run via scripts/run_import.py.")
    if args.write:
        preflight(SERVICE_KEY)

    print("Reading brand storefronts…")
    meta = {}
    for bkey, domain in BRAND_DOMAINS.items():
        catalog = fetch_catalog(domain)
        if not catalog:
            print(f"  (unreachable: {domain})")
            continue
        brand = BRAND_NAMES.get(bkey, bkey).lower()
        for p in catalog:
            meta[(brand, norm(p.get("title", "")))] = p
    print(f"  {len(meta)} storefront entries\n")

    rows = fetch_all(ANON_KEY, "products?select=id,brand,name,category,canonical_category,excluded_reason")

    changes = []
    for r in rows:
        p = meta.get(((r.get("brand") or "").strip().lower(), norm(r.get("name", ""))))
        if not p:
            continue
        new = guess_category(p)
        old = r.get("category")
        if new and new != old:
            changes.append((r, old, new))
        elif new is None and (old or "").lower().startswith("sunscreen"):
            # A stale Sunscreen must not survive just because the corrected
            # rule has no replacement to offer. Everywhere else "no new answer"
            # safely leaves the old one standing -- several stored categories
            # are right even though the rule cannot re-derive them (Tatcha's
            # "The Rice Wash" really is a cleanser). Sunscreen is the one
            # exception, because /for-you ranks within a category and someone
            # shopping for sun protection would be shown something that offers
            # none. Unknown is honest; wrongly-Sunscreen is not.
            changes.append((r, old, None))

    print(f"{len(changes)} products would change category\n")
    moves = Counter(f"{old} -> {new}" for _, old, new in changes)
    for move, n in moves.most_common(25):
        print(f"  {n:5}  {move}")

    print("\n  --- sample ---")
    for r, old, new in changes[:25]:
        flag = "  <-- was in Sunscreens" if (old or "").lower().startswith("sunscreen") else ""
        print(f"    {(r.get('brand') or '?')[:16]:<16} {(r['name'] or '')[:40]:<40} {old} -> {new}{flag}")

    if not args.write:
        print("\nReport only. Re-run with --write to apply.")
        return

    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    applied = failed = 0
    for r, _old, new in changes:
        resp = SESSION.patch(
            f"{SUPABASE_URL}/rest/v1/products?id=eq.{urllib.parse.quote(r['id'])}",
            headers=headers,
            json={"category": new, "product_type": new},  # new may be None -> clears it
            timeout=30,
        )
        if resp.status_code < 300:
            applied += 1
        else:
            failed += 1
            print(f"  failed {r['id']}: {resp.status_code} {resp.text[:80]}")
    print(f"\nRecategorised {applied} of {len(changes)} products ({failed} failed).")


if __name__ == "__main__":
    main()
