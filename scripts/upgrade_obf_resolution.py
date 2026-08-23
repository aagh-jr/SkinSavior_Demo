"""
upgrade_obf_resolution.py
-------------------------
Swaps stored Open Beauty Facts thumbnails for their full-resolution originals.

THE BUG THIS FIXES
Every OBF image in the catalogue was stored as the `.400.jpg` variant — OBF's
400px thumbnail. Because OBF photos are portrait phone shots, constraining the
LONG edge to 400px leaves the short edge tiny: measured examples include
151x400, 163x400 and 116x400. Rendered into a product grid those are upscaled
several times over, which is why they read as "missing" rather than merely
amateur.

OBF also serves `.full.jpg` from the same path. Measured on 25 random products:
all 25 had one, at 5-10x the linear resolution (151x400 -> 1493x3959,
299x400 -> 3472x4640).

WHAT THIS DOES NOT FIX
Resolution, not photography. A 3024x4032 photo of a bottle on a kitchen
counter is a sharp photo of a bottle on a kitchen counter. Products that
backfill_photos.py can confirm on INCIDecoder get real pack shots instead;
this is what the remainder falls back to.

The full-res URL is verified with a real request before it is stored. A 404
written into image_url would turn a bad photo into a broken one.

Usage
-----
  python scripts/run_import.py upgrade_obf_resolution.py           # report
  python scripts/run_import.py upgrade_obf_resolution.py --write
"""

import argparse
import concurrent.futures as cf
import os
import re
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_popular_products import SESSION, SUPABASE_URL, preflight  # noqa: E402
from classify_catalog import ANON_KEY, fetch_all  # noqa: E402

SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip().strip('"').strip("'").strip()

UA = {"User-Agent": "skinsavior/1.0 (skincare ingredient index)"}

# OBF encodes the size in the filename: front_fr.3.400.jpg -> front_fr.3.full.jpg
THUMB = re.compile(r"\.(\d+)\.400\.jpg$", re.I)


def full_res(url: str) -> str | None:
    return THUMB.sub(r".\1.full.jpg", url) if THUMB.search(url or "") else None


def verify(url: str) -> int:
    """
    Confirm the full-res file exists AND is genuinely bigger.

    A HEAD would be cheaper, but OBF's CDN answers HEAD inconsistently, and
    writing an image_url that 404s would turn a poor photo into a broken one —
    strictly worse than doing nothing.
    """
    try:
        r = SESSION.get(url, headers=UA, timeout=30, stream=True)
        if r.status_code != 200:
            r.close()
            return 0
        # Only enough bytes to prove it is a real image, not an error page —
        # reading whole files would pull ~200MB across the catalogue.
        size = len(r.raw.read(64_000))
        r.close()
        return size
    except Exception:
        return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()

    if args.write and not SERVICE_KEY:
        sys.exit("SUPABASE_SERVICE_KEY is not set. Run via scripts/run_import.py.")
    if args.write:
        preflight(SERVICE_KEY)

    rows = fetch_all(ANON_KEY, "products?select=id,brand,name,image_url,excluded_reason")
    targets = [
        r for r in rows
        if not r.get("excluded_reason") and full_res(r.get("image_url") or "")
    ]
    if args.limit:
        targets = targets[: args.limit]

    print(f"{len(targets)} products on an OBF 400px thumbnail\n")

    def work(r):
        return r, full_res(r["image_url"]), verify(full_res(r["image_url"]))

    with cf.ThreadPoolExecutor(args.workers) as ex:
        results = list(ex.map(work, targets))

    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    # 12kB is comfortably above a 400px thumbnail (10-40kB measured) only in
    # the sense of being a real image; anything smaller is an error page.
    upgraded = missing = failed = 0
    for r, url, size in results:
        if size < 12_000:
            missing += 1
            print(f"  no full-res  {(r.get('brand') or '?')[:16]:<16} {(r['name'] or '')[:40]}")
            continue
        upgraded += 1
        if not args.write:
            continue
        resp = SESSION.patch(
            f"{SUPABASE_URL}/rest/v1/products?id=eq.{urllib.parse.quote(r['id'])}",
            headers=headers, json={"image_url": url}, timeout=30,
        )
        if resp.status_code >= 300:
            upgraded -= 1
            failed += 1
            print(f"  DB error {resp.status_code}: {resp.text[:80]}")

    print("\n" + "=" * 62)
    verb = "would upgrade" if not args.write else "upgraded"
    print(f"{verb}: {upgraded} | no full-res available: {missing} | failed: {failed}")
    if not args.write:
        print("\nReport only. Re-run with --write to apply.")


if __name__ == "__main__":
    main()
