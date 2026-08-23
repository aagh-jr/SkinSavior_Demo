"""
backfill_photos.py
------------------
Replaces crowd-sourced phone photos with official product photography.

WHY THIS EXISTS
688 of 1,215 visible products carry brand studio shots, imported from Shopify
storefronts. The remaining 446 are Open Beauty Facts seed rows: photographs of
bottles on kitchen counters, or nothing at all. Several of the brands involved
are ones people actually search for — CeraVe, La Roche-Posay, The Ordinary,
Neutrogena, Cetaphil, Paula's Choice, Bioderma, Avene, Eucerin, Vichy — and
none of them run Shopify, so import_brand_catalogs.py can never reach them.

INCIDecoder can. It hosts an official pack shot for most products it indexes
(incidecoder-content.storage.googleapis.com), and we already scrape it for INCI
lists, so the photo costs no extra request.

THE RISK, AND THE GUARD
INCIDecoder search returns a best-effort top hit. Accepting it blindly would
attach the wrong bottle to a product — worse than a bad photo, because a bad
photo looks bad while a wrong photo looks fine. Brand lines make this easy to
hit: "CeraVe Moisturising Lotion" and "CeraVe Moisturising Cream" are one
search result apart.

So identity is verified against the FORMULA, not the name. We already store
raw_ingredients for 442 of the 446 candidates. If the INCI list on the
INCIDecoder page substantially matches the one we hold, it is the same product
and its photo is safe to take. A name check runs alongside it, because two
variants in a line can share a formula while differing in what matters.

Products that fail either check keep the photo they have. "We could not
confirm this is the same product" is a distinct outcome from "there is no
photo" and is reported as such — the failure-that-looks-like-absence problem
this repo keeps running into.

Usage
-----
  python scripts/run_import.py backfill_photos.py                 # report
  python scripts/run_import.py backfill_photos.py --write
  python scripts/run_import.py backfill_photos.py --brands cerave,neutrogena
  python scripts/run_import.py backfill_photos.py --known-brands --write
"""

import argparse
import os
import re
import sys
import time
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_popular_products import SESSION, SUPABASE_URL, preflight, scrape_incidecoder  # noqa: E402
from classify_catalog import ANON_KEY, fetch_all  # noqa: E402
from import_brand_catalogs import INCI_BACKOFF, SLEEP_INCI, search_terms  # noqa: E402

SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip().strip('"').strip("'").strip()

# Hosts that mean "this product still needs a real photo".
NEEDS_PHOTO = ("images.openbeautyfacts.org",)

# An OPT-IN shortlist, not the default. See --known-brands.
#
# This list was originally the default, on the assumption that INCIDecoder
# wouldn't index European supermarket own-label — Cien (Lidl), Sun Dance (dm),
# Ombra (Aldi), Carrefour, Systeme U — so querying them would only ever cost
# ~2s to confirm a miss. That assumption was never measured, and it was wrong:
# a 15-product random sample of exactly that tail returned 4 verified photos
# (Bergamo, Beauty Society, Sun Ozon, Etos), a ~27% hit rate. Skipping the tail
# by default was silently discarding ~80 real photos.
#
# Matched case-insensitively as a substring, because the OBF brand field is
# free text and arrives as "L'Oreal, L'Oreal Consumer products, Garnier".
KNOWN_BRANDS = [
    "cerave", "la roche", "roche-posay", "the ordinary", "neutrogena",
    "cetaphil", "paula's choice", "paulas choice", "drunk elephant",
    "bioderma", "avene", "avène", "eucerin", "vichy", "uriage", "nivea",
    "aveeno", "garnier", "l'oreal", "l'oréal", "kiehl's", "weleda",
    "yves rocher", "melvita", "caudalie", "embryolisse", "mixa", "biore",
    "bioré", "hada labo", "clinique", "olay", "pond's", "simple",
    "first aid beauty", "the inkey", "the body shop", "burt's bees",
    "eltamd", "elta md", "vanicream", "differin", "sunday riley",
    "youth to the people", "good molecules", "purito", "isntree",
    "some by mi", "round lab", "abib", "pyunkang", "benton", "iunik",
    "dr jart", "dr. jart", "laneige", "sulwhasoo", "etude", "innisfree",
]


def norm_ing(name: str) -> str:
    """Loose ingredient key: INCI punctuation varies between sources."""
    return re.sub(r"[^a-z0-9]+", "", (name or "").lower())


def parse_stored(raw: str | None) -> set[str]:
    if not raw:
        return set()
    parts = re.split(r"[,•;\n]+", raw)
    return {norm_ing(p) for p in parts if norm_ing(p)}


# Words that carry no identifying power in a product name.
STOPWORDS = {
    "the", "and", "for", "with", "new", "de", "la", "le", "du", "des", "a",
    "of", "ml", "oz", "fl", "g", "skin", "care", "skincare", "face", "facial",
}


def name_tokens(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", (text or "").lower())
    return {w for w in words if len(w) > 2 and w not in STOPWORDS}


def formula_match(stored: set[str], fetched: list[str]) -> float:
    """
    Containment of the smaller INCI list in the larger.

    Containment rather than Jaccard because the two sources legitimately differ
    in length: OBF lists are transcribed from a physical carton and often drop
    the tail, while INCIDecoder carries the full list. Jaccard would score a
    correct match as a mismatch purely on length.
    """
    got = {norm_ing(n) for n in fetched if norm_ing(n)}
    if not stored or not got:
        return 0.0
    return len(stored & got) / min(len(stored), len(got))


def lookup(brand: str, title: str) -> dict:
    """INCIDecoder lookup with the same backoff the importer uses."""
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
        if result.get("fallback_image"):
            return result
        last = result
        if result.get("_fetch_failed"):
            return result
    return last


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--brands", default="", help="comma-separated brand substrings")
    ap.add_argument("--known-brands", action="store_true",
                    help="restrict to KNOWN_BRANDS (faster, but misses ~27%% of the tail)")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--ids", default="",
                    help="comma-separated product ids; overrides the "
                         "needs-a-photo test so a product that already has a "
                         "Shopify image can be replaced (used for images a "
                         "vision review flagged as promo art rather than a "
                         "pack shot -- no filename rule can detect those)")
    ap.add_argument("--min-formula", type=float, default=0.55,
                    help="INCI containment required when the name also agrees")
    ap.add_argument("--sure-formula", type=float, default=0.80,
                    help="INCI containment conclusive on its own, name ignored")
    ap.add_argument("--min-name", type=float, default=0.34,
                    help="required share of our name's tokens in theirs, 0-1")
    args = ap.parse_args()

    if args.write and not SERVICE_KEY:
        sys.exit("SUPABASE_SERVICE_KEY is not set. Run via scripts/run_import.py.")
    if args.write:
        preflight(SERVICE_KEY)

    rows = fetch_all(
        ANON_KEY,
        "products?select=id,brand,name,image_url,raw_ingredients,excluded_reason",
    )

    def needs(r):
        if r.get("excluded_reason"):
            return False
        url = r.get("image_url") or ""
        return not url or any(h in url for h in NEEDS_PHOTO)

    forced = {i.strip() for i in args.ids.split(",") if i.strip()}
    targets = ([r for r in rows if r["id"] in forced] if forced
               else [r for r in rows if needs(r)])

    filters = [f.strip().lower() for f in args.brands.split(",") if f.strip()]
    if not filters and args.known_brands:
        filters = KNOWN_BRANDS
    if filters:
        targets = [
            r for r in targets
            if any(f in (r.get("brand") or "").lower() for f in filters)
        ]

    # No stored INCI means no way to confirm identity, so the photo could not
    # be accepted even if one were found. Skip rather than spend the lookup.
    unverifiable = [r for r in targets if not parse_stored(r.get("raw_ingredients"))]
    targets = [r for r in targets if parse_stored(r.get("raw_ingredients"))]

    if args.limit:
        targets = targets[: args.limit]

    print(f"{len(targets)} products to check"
          f"  ({len(unverifiable)} skipped: no stored INCI to verify against)\n")

    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    updated = no_photo = rejected = throttled = failed = 0
    for i, r in enumerate(targets, 1):
        brand = (r.get("brand") or "").split(",")[0].strip()
        title = (r.get("name") or "").strip()
        label = f"{brand} {title}"[:58]

        result = lookup(brand, title)
        if result.get("_fetch_failed"):
            throttled += 1
            print(f"[{i}/{len(targets)}] THROTTLED  {label}")
            continue

        image = result.get("fallback_image")
        if not image:
            no_photo += 1
            print(f"[{i}/{len(targets)}] no photo   {label}")
            continue

        # Identity: same formula AND a recognisable name overlap.
        stored = parse_stored(r.get("raw_ingredients"))
        f_score = formula_match(stored, result.get("ingredients") or [])
        ours = name_tokens(title)
        theirs = name_tokens(urllib.parse.unquote(result.get("source_url") or ""))
        n_score = len(ours & theirs) / len(ours) if ours else 0.0

        # A near-perfect INCI match settles identity by itself. Two different
        # products do not share ~80%+ of an ordered ingredient list, and
        # requiring the name to agree as well produced false rejections on
        # every non-English row: Avene's "Creme peaux intolerantes" matched a
        # formula 1.00 and a name 0.00, purely because we store the French
        # title and INCIDecoder indexes the English one. Below that bar the
        # formula is suggestive rather than decisive, so the name must back
        # it up.
        confident = f_score >= args.sure_formula or (
            f_score >= args.min_formula and n_score >= args.min_name
        )
        if not confident:
            rejected += 1
            print(f"[{i}/{len(targets)}] REJECT     {label}"
                  f"  (formula {f_score:.2f}, name {n_score:.2f})")
            continue

        print(f"[{i}/{len(targets)}] ok         {label}"
              f"  (formula {f_score:.2f}, name {n_score:.2f})")

        if not args.write:
            updated += 1
            continue

        resp = SESSION.patch(
            f"{SUPABASE_URL}/rest/v1/products?id=eq.{urllib.parse.quote(r['id'])}",
            headers=headers, json={"image_url": image}, timeout=30,
        )
        if resp.status_code < 300:
            updated += 1
        else:
            failed += 1
            print(f"           DB error {resp.status_code}: {resp.text[:80]}")

    print("\n" + "=" * 62)
    verb = "would update" if not args.write else "updated"
    print(f"{verb}: {updated} | not on INCIDecoder: {no_photo} | "
          f"identity rejected: {rejected} | failed: {failed}")
    if throttled:
        print(f"\nTHROTTLED: {throttled} lookups were refused. These are NOT "
              "confirmed missing — re-run to pick them up.")
    if not args.write:
        print("\nReport only. Re-run with --write to apply.")


if __name__ == "__main__":
    main()
