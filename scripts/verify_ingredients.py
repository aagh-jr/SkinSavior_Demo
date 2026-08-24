"""
verify_ingredients.py
---------------------
Finds and clears ingredient lists that belong to a DIFFERENT product.

THE BUG THIS CLEANS UP
import_brand_catalogs.lookup_inci() used to accept INCIDecoder's top search
hit without checking it was the right product. INCIDecoder matches on product
NAME, across brands, so the importer stored:

    Kinship    Moisturizing Body Cream -> byphasse-caresse-moisturizing-body-cream
    BYOMA      Glass Skin              -> cuura-glass-skin
    BYOMA      Ultralight Face Fluid   -> ivy-aia-ultralight-sun-face-fluid-spf50
    Patchology glow potion             -> herbivore-prism-exfoliating-glow-potion
    Dermalogica luminfusion            -> novex-collagen-infusion

Measured at 4 in 30 sampled products, so roughly 160 of the catalogue. The
INCI list drives match scoring, clash detection and the pregnancy/reaction
safety blocks, so a wrong list makes every one of those answer confidently
about a different product. This is the repo's recurring failure mode in its
worst form: not absence dressed as data, but wrong data dressed as right data.

lookup_inci() now rejects a wrong-brand hit. This script repairs what the old
version already wrote.

WHAT IT DOES, AND WHAT IT REFUSES TO DO
For each product it re-runs the (now guarded) lookup:

  verified   the page belongs to this brand -> refresh the INCI from it
  CORRUPT    a page matched the name but a different brand -> CLEAR ours,
             because we have positively proven the stored list is wrong
  no hit     nothing found now -> LEAVE ALONE and report
  throttled  request refused -> LEAVE ALONE and report

Only the proven-corrupt case destroys anything. "We could not check this" is a
distinct outcome from "we checked and it is wrong", and conflating them would
delete good data on a bad network day.

Cleared products lose their links too, so classify_catalog.py will flag them
no_ingredients and hide them. Hidden is the right state: an ingredient index
cannot say anything true about a product whose ingredients it does not know.

Usage
-----
  python scripts/run_import.py verify_ingredients.py                # report
  python scripts/run_import.py verify_ingredients.py --write
  python scripts/run_import.py verify_ingredients.py --write --brands dermalogica
"""

import argparse
import os
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_popular_products import Db, SESSION, SUPABASE_URL, preflight  # noqa: E402
from classify_catalog import ANON_KEY, fetch_all  # noqa: E402
from import_brand_catalogs import _is_same_product, lookup_inci  # noqa: E402
from backfill_photos import norm_ing, parse_stored  # noqa: E402

SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip().strip('"').strip("'").strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--brands", default="", help="comma-separated brand substrings")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--start", type=int, default=0, help="resume from this offset")
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
    targets = [
        r for r in rows
        if not r.get("excluded_reason")
        and (r.get("raw_ingredients") or "").strip()
        and "shopify" in (r.get("image_url") or "")
    ]
    filters = [f.strip().lower() for f in args.brands.split(",") if f.strip()]
    if filters:
        targets = [r for r in targets
                   if any(f in (r.get("brand") or "").lower() for f in filters)]
    targets.sort(key=lambda r: ((r.get("brand") or ""), r.get("name") or ""))
    targets = targets[args.start:]
    if args.limit:
        targets = targets[: args.limit]

    print(f"{len(targets)} imported products to verify\n", flush=True)

    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    verified = corrupt = nohit = throttled = refreshed = failed = 0
    for i, r in enumerate(targets, 1):
        brand = (r.get("brand") or "").strip()  # NOT split on "," -- see
        # _is_same_product: "Dear, Klairs" is one brand, and taking the
        # first segment rejected correct klairs-* matches.
        title = (r.get("name") or "").strip()
        label = f"{brand} {title}"[:52]

        result = lookup_inci(brand, title)

        if result.get("_fetch_failed"):
            throttled += 1
            print(f"[{i}/{len(targets)}] THROTTLED  {label}", flush=True)
            continue

        if result.get("ingredients") and _is_same_product(result, brand, title):
            verified += 1
            fetched = result["ingredients"]
            stored = parse_stored(r.get("raw_ingredients"))
            got = {norm_ing(n) for n in fetched if norm_ing(n)}
            drift = len(stored ^ got) if stored else 0
            print(f"[{i}/{len(targets)}] verified   {label}"
                  f"{'  (refreshed)' if drift > 3 else ''}", flush=True)
            if args.write and drift > 3:
                try:
                    resp = SESSION.patch(
                        f"{SUPABASE_URL}/rest/v1/products?id=eq.{urllib.parse.quote(r['id'])}",
                        headers=headers,
                        json={"raw_ingredients": ", ".join(fetched)}, timeout=30,
                    )
                    if resp.status_code >= 300:
                        raise RuntimeError(f"{resp.status_code} {resp.text[:80]}")
                    resolved = db.resolve_ingredients(fetched)
                    ids = [resolved[k] for k in (n.strip().lower() for n in fetched)
                           if k in resolved]
                    if ids:
                        db.link_ingredients(r["id"], ids, replace=True)
                    refreshed += 1
                except Exception as e:
                    failed += 1
                    print(f"           DB error: {str(e)[:100]}", flush=True)
            continue

        if result.get("_wrong_brand"):
            # Proven wrong: a page matched the name under another brand.
            corrupt += 1
            src = (result.get("rejected_url") or "").rsplit("/", 1)[-1][:40]
            print(f"[{i}/{len(targets)}] CORRUPT    {label}  <- {src}", flush=True)
            if args.write:
                try:
                    resp = SESSION.patch(
                        f"{SUPABASE_URL}/rest/v1/products?id=eq.{urllib.parse.quote(r['id'])}",
                        headers=headers, json={"raw_ingredients": None}, timeout=30,
                    )
                    if resp.status_code >= 300:
                        raise RuntimeError(f"{resp.status_code} {resp.text[:80]}")
                    SESSION.delete(
                        f"{SUPABASE_URL}/rest/v1/product_ingredients"
                        f"?product_id=eq.{urllib.parse.quote(r['id'])}",
                        headers=headers, timeout=30,
                    )
                except Exception as e:
                    failed += 1
                    print(f"           DB error: {str(e)[:100]}", flush=True)
            continue

        nohit += 1
        print(f"[{i}/{len(targets)}] no hit     {label}  (left as-is)", flush=True)

    print("\n" + "=" * 62, flush=True)
    print(f"verified: {verified} (refreshed {refreshed}) | CORRUPT cleared: {corrupt} | "
          f"no hit: {nohit} | throttled: {throttled} | failed: {failed}", flush=True)
    if not args.write:
        print("\nReport only. Re-run with --write to apply.", flush=True)
    else:
        print("\nRun classify_catalog.py --write next: cleared products now have no "
              "ingredients and should be hidden.", flush=True)


if __name__ == "__main__":
    main()
