"""
enrich_missing_inci.py
----------------------
Recovers ingredient lists — and photos — for products stored without either.

WHY THIS EXISTS
157 rows carry no raw_ingredients. That single gap causes three visible
problems at once:

  1. classify_catalog.py flags them `no_ingredients` and hides them, because a
     product we cannot analyse is padding in an ingredient index.
  2. backfill_photos.py skips them, because it verifies photo identity by
     comparing INCI lists and there is nothing to compare against.
  3. They are still reachable through a saved routine, so they render on the
     landing page as a name and an empty grey box.

The demo routine on the home page is made of exactly these: The Face Shop
Rice Water Cleansing Oil, Isntree Low pH Cleansing Foam, Abib Jericho Rose
Serum. All real, well-known products that INCIDecoder indexes — they were just
seeded by an extraction pass that never captured the ingredients.

THE GUARD, AND WHY IT DIFFERS FROM backfill_photos.py
That script verifies identity by FORMULA, which is far stronger than a name.
Here there is no stored formula to compare against — recovering it is the whole
point — so the name is all we have, and the bar has to be higher to compensate:
the brand must appear in the INCIDecoder URL, and most of our name's
distinctive words must appear there too. A wrong match here is worse than a
wrong photo: it would write another product's ingredients onto this one, and
every downstream safety check would then be answering about the wrong product.

Usage
-----
  python scripts/run_import.py enrich_missing_inci.py                 # report
  python scripts/run_import.py enrich_missing_inci.py --write
  python scripts/run_import.py enrich_missing_inci.py --write --limit 20
"""

import argparse
import os
import re
import sys
import unicodedata
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_popular_products import Db, SESSION, SUPABASE_URL, preflight  # noqa: E402
from classify_catalog import ANON_KEY, fetch_all  # noqa: E402
from import_brand_catalogs import lookup_inci  # noqa: E402
from backfill_photos import name_tokens  # noqa: E402

SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip().strip('"').strip("'").strip()


def _fold(text: str) -> str:
    """Strip accents. name_tokens() matches [a-z0-9], so an accented letter
    splits a word into fragments: "L'Oreal" with an accent became {l, or, al}
    and no brand token survived the length filter."""
    return "".join(
        c for c in unicodedata.normalize("NFKD", text or "")
        if not unicodedata.combining(c)
    )


def slug_tokens(url: str) -> set[str]:
    """Distinctive words in an INCIDecoder product URL."""
    tail = urllib.parse.unquote(url or "").rsplit("/", 1)[-1]
    return name_tokens(tail.replace("-", " "))


def brand_in(url: str, brand: str) -> bool:
    """At least one distinctive brand word appears in the URL.

    Compared by prefix rather than equality, because apostrophes split a brand
    into pieces that the URL spells as one word: "Kiehl's" tokenises to
    {kiehl}, while the slug says "kiehls". Exact matching rejected Kiehl's
    Ultra Facial Moisturizer on a perfect 1.00 name score. Same shape for
    "Paula's Choice" and "L'Oreal".
    """
    btok = [t for t in name_tokens(_fold(brand)) if len(t) > 3]
    if not btok:
        return False
    stok = slug_tokens(_fold(url))
    return any(b in s or s in b for b in btok for s in stok)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--brands", default="", help="comma-separated brand substrings")
    ap.add_argument("--min-name", type=float, default=0.65,
                    help="share of our name's words that must appear in theirs")
    args = ap.parse_args()

    if args.write and not SERVICE_KEY:
        sys.exit("SUPABASE_SERVICE_KEY is not set. Run via scripts/run_import.py.")
    if args.write:
        preflight(SERVICE_KEY)
    db = Db(SERVICE_KEY) if args.write else None

    rows = fetch_all(
        ANON_KEY,
        "products?select=id,brand,name,image_url,raw_ingredients,excluded_reason",
    )
    targets = [r for r in rows if not (r.get("raw_ingredients") or "").strip()]

    filters = [f.strip().lower() for f in args.brands.split(",") if f.strip()]
    if filters:
        targets = [r for r in targets
                   if any(f in (r.get("brand") or "").lower() for f in filters)]
    if args.limit:
        targets = targets[: args.limit]

    print(f"{len(targets)} products with no ingredient list\n")

    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    found = rejected = missing = throttled = failed = photos = 0
    for i, r in enumerate(targets, 1):
        brand = (r.get("brand") or "").strip()  # NOT split on "," -- see
        # _is_same_product: "Dear, Klairs" is one brand, and taking the
        # first segment rejected correct klairs-* matches.
        title = (r.get("name") or "").strip()
        label = f"{brand} {title}"[:56]

        result = lookup_inci(brand, title)
        if result.get("_fetch_failed"):
            throttled += 1
            print(f"[{i}/{len(targets)}] THROTTLED  {label}")
            continue

        ingredients = result.get("ingredients") or []
        url = result.get("source_url") or ""
        if not ingredients:
            missing += 1
            print(f"[{i}/{len(targets)}] not indexed {label}")
            continue

        ours = name_tokens(title)
        score = len(ours & slug_tokens(url)) / len(ours) if ours else 0.0
        if score < args.min_name or not brand_in(url, brand):
            rejected += 1
            print(f"[{i}/{len(targets)}] REJECT     {label}  "
                  f"(name {score:.2f}, brand {'y' if brand_in(url, brand) else 'n'})")
            continue

        image = result.get("fallback_image")
        print(f"[{i}/{len(targets)}] ok         {label}  "
              f"{len(ingredients):3} ing  (name {score:.2f}){'  +photo' if image and not r.get('image_url') else ''}")
        found += 1
        if not args.write:
            if image and not r.get("image_url"):
                photos += 1
            continue

        try:
            patch = {"raw_ingredients": ", ".join(ingredients)}
            if image and not r.get("image_url"):
                patch["image_url"] = image
                photos += 1
            resp = SESSION.patch(
                f"{SUPABASE_URL}/rest/v1/products?id=eq.{urllib.parse.quote(r['id'])}",
                headers=headers, json=patch, timeout=30,
            )
            if resp.status_code >= 300:
                raise RuntimeError(f"{resp.status_code} {resp.text[:100]}")

            # Link the ingredients too — raw_ingredients alone leaves the
            # product unscoreable, which is the state we are fixing.
            resolved = db.resolve_ingredients(ingredients)
            ids = [resolved[k] for k in (n.strip().lower() for n in ingredients)
                   if k in resolved]
            if ids:
                db.link_ingredients(r["id"], ids, replace=True)
            else:
                print(f"           WARNING: {len(ingredients)} ingredients resolved to 0 links")
        except Exception as e:
            found -= 1
            failed += 1
            print(f"           DB error: {str(e)[:110]}")

    print("\n" + "=" * 62)
    verb = "would recover" if not args.write else "recovered"
    print(f"{verb}: {found} ingredient lists (+{photos} photos) | "
          f"not indexed: {missing} | name rejected: {rejected} | failed: {failed}")
    if throttled:
        print(f"\nTHROTTLED: {throttled} refused. NOT confirmed missing — re-run.")
    if not args.write:
        print("\nReport only. Re-run with --write to apply.")


if __name__ == "__main__":
    main()
