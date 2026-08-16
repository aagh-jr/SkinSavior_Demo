"""
backfill_ingredient_links.py
----------------------------
Rebuilds product -> ingredient links for products that have their INCI text
but no links.

WHY THEY'RE MISSING
import_brand_catalogs.py called a Db method that had been removed (per-name
ingredient_id, replaced by the batched resolve_ingredients), inside a bare
`except Exception: pass`. The AttributeError was swallowed on every product,
so rows were written with raw_ingredients populated and zero links — leaving
~60% of the catalogue unscoreable while looking fine in the products table.

The text is already stored, so this is a pure parse-and-link pass. No
scraping, no rate limits: it runs in a couple of minutes.

Usage
-----
  python scripts/backfill_ingredient_links.py                # report only
  set SUPABASE_SERVICE_KEY=eyJ...
  python scripts/backfill_ingredient_links.py --write
"""

import argparse
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_popular_products import Db, SESSION, SUPABASE_URL, preflight  # noqa: E402

SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip().strip('"').strip("'").strip()

ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdHZjbGh4"
    "cmpyb2Vjam51Z3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjQxOTIsImV4cCI6MjA5NDU0MDE5Mn0"
    ".EQ_ZfnXwXB4oR_4mauODpiTTKrFSa8hv-EF5RudupoQ"
)


def parse_inci(raw: str) -> list:
    """
    Split a stored INCI string back into an ordered ingredient list.

    Scraped text carries invisible characters — TIRTIR's lists contain
    zero-width spaces inside slashes ("Bis-Behenyl/<ZWSP>Isostearyl") — which
    would otherwise produce ingredient names that never match an existing row
    and quietly create duplicates.
    """
    if not raw:
        return []
    # Strip zero-width and bidi control characters. Written as escapes rather
    # than literals so the source stays readable in any encoding.
    text = re.sub(r"[​-‏‪-‮﻿]", "", raw)
    # Drop bracketed asides ("(and)", percentages) that aren't ingredients.
    text = re.sub(r"\([^)]*\)", " ", text)
    out, seen = [], set()
    for part in text.split(","):
        name = re.sub(r"\s+", " ", part).strip().strip("*.:;-").strip()
        if len(name) < 2 or len(name) > 120:
            continue
        key = name.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(name)
    return out


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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="create the links")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    if args.write and not SERVICE_KEY:
        sys.exit(
            "SUPABASE_SERVICE_KEY is not set — writing needs it.\n"
            "  cmd: set SUPABASE_SERVICE_KEY=eyJ...\n"
            "Run without --write for a report."
        )
    if args.write:
        preflight(SERVICE_KEY)

    key = SERVICE_KEY if args.write else ANON_KEY

    products = fetch_all(key, "products?select=id,brand,name,raw_ingredients")
    links = fetch_all(key, "product_ingredients?select=product_id")
    linked = {row["product_id"] for row in links}

    candidates = [
        p for p in products
        if p["id"] not in linked and (p.get("raw_ingredients") or "").strip()
    ]
    no_data = [
        p for p in products
        if p["id"] not in linked and not (p.get("raw_ingredients") or "").strip()
    ]

    print(f"{len(products)} products")
    print(f"  {len(products) - len(candidates) - len(no_data)} already linked")
    print(f"  {len(candidates)} have INCI text but no links  <- fixable here")
    print(f"  {len(no_data)} have no ingredient data at all  <- need re-scraping")

    if not candidates:
        return
    if args.limit:
        candidates = candidates[: args.limit]

    if not args.write:
        print("\nSample of what would be linked:\n")
        for p in candidates[:5]:
            names = parse_inci(p["raw_ingredients"])
            print(f"  {p['brand'][:18]:<18} {p['name'][:38]:<38} {len(names):3} ingredients")
            print(f"      {', '.join(names[:6])}…")
        print("\nReport only. Re-run with --write (and SUPABASE_SERVICE_KEY) to create links.")
        return

    db = Db(SERVICE_KEY)
    done = skipped = failed = 0
    for i, p in enumerate(candidates, start=1):
        names = parse_inci(p["raw_ingredients"])
        if not names:
            skipped += 1
            continue
        try:
            resolved = db.resolve_ingredients(names)
            ids = [
                resolved[k]
                for k in (n.strip().lower() for n in names)
                if k in resolved
            ]
            if not ids:
                skipped += 1
                continue
            db.link_ingredients(p["id"], ids)
            done += 1
            if i % 25 == 0 or i == len(candidates):
                print(f"  [{i}/{len(candidates)}] linked {done}, skipped {skipped}, failed {failed}")
        except Exception as e:
            failed += 1
            print(f"  {p['name'][:40]}: {str(e)[:100]}")

    print(f"\nLinked {done} products | skipped {skipped} | failed {failed}")


if __name__ == "__main__":
    main()
