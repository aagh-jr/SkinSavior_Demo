"""
build_contact_sheets.py
-----------------------
Renders every catalogue image into numbered contact sheets so a human (or a
vision model) can spot the ones that are not clean product photography.

WHY THIS EXISTS
Filename rules cannot detect a promo badge composited into an otherwise normal
image. The worst offenders are named exactly like the good ones:

    anua-us-moisturizer-pdrn-hyaluronic-acid-100-moisturizing-cream.jpg

...and that one is a model holding the product. Two Torriden images carried a
"FREE GIFT" lockup under the filenames BF_CONTROL_Serum_TN_CORTIS.jpg and
BF_Cream_CORTIS.jpg. No pattern generalises. Looking at the pixels is the only
thing that works.

40 images per sheet at ~210px is legible enough to judge, and turns ~1,200
products into ~30 sheets. index.json maps every printed number back to the
product, so a review pass produces a list of ids to re-source.

WHAT TO FLAG
  - models or hands holding the product; treatment photos with no product
  - before/after faces, ingredient infographics, benefit callout annotations
  - discount badges (30% OFF), retailer badges (amazon #1, TikTok Shop)
  - award seals composited onto the shot
  - multi-product lineups and size-comparison composites
  - texture swatches with no product visible

Brand art direction is NOT a defect. A serum photographed on fruit, on a
coloured ground, or against black is fine as long as the product is clearly
visible. The test is "would a shopper recognise the product from this", not
"is the background white".

Usage
-----
  python scripts/build_contact_sheets.py --out sheets/
  python scripts/build_contact_sheets.py --out sheets/ --host shopify
  python scripts/build_contact_sheets.py --out sheets/ --brands cosrx,anua
"""

import argparse
import concurrent.futures as cf
import io
import json
import os
import re
import sys

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from classify_catalog import ANON_KEY, fetch_all  # noqa: E402

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("Pillow is required:  pip install pillow")

UA = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}

CELL = 210
COLS = 8
ROWS = 5
LABEL_H = 18


def thumb_url(url: str) -> str:
    """Ask Shopify for a small render; harmless on other hosts."""
    return re.sub(r"_(\d+)x(\d+)?(\.[a-z]+)$", r"_400x400\3", url)


def fetch_image(row: dict):
    for candidate in (thumb_url(row["image_url"]), row["image_url"]):
        try:
            resp = requests.get(candidate, headers=UA, timeout=20)
            if resp.status_code == 200 and len(resp.content) > 1500:
                return row, Image.open(io.BytesIO(resp.content)).convert("RGB")
        except Exception:
            continue
    return row, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="sheets", help="output directory")
    ap.add_argument("--host", default="", help="only images from this host substring")
    ap.add_argument("--brands", default="", help="comma-separated brand substrings")
    ap.add_argument("--workers", type=int, default=16)
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)

    rows = fetch_all(ANON_KEY, "products?select=id,brand,name,image_url,excluded_reason")
    items = [r for r in rows if not r.get("excluded_reason") and r.get("image_url")]
    if args.host:
        items = [r for r in items if args.host in r["image_url"]]
    filters = [f.strip().lower() for f in args.brands.split(",") if f.strip()]
    if filters:
        items = [r for r in items
                 if any(f in (r.get("brand") or "").lower() for f in filters)]

    # Sort by brand so each sheet is visually coherent: a brand's house style
    # is obvious in a block, which makes the odd one out easy to see.
    items.sort(key=lambda r: ((r.get("brand") or ""), r.get("name") or ""))
    print(f"{len(items)} images to fetch")

    with cf.ThreadPoolExecutor(args.workers) as ex:
        fetched = [pair for pair in ex.map(fetch_image, items) if pair[1]]
    print(f"{len(fetched)} downloaded ({len(items) - len(fetched)} unreachable)")

    per_sheet = COLS * ROWS
    index = {}
    for start in range(0, len(fetched), per_sheet):
        chunk = fetched[start:start + per_sheet]
        sheet = Image.new("RGB", (COLS * CELL, ROWS * (CELL + LABEL_H)), "white")
        draw = ImageDraw.Draw(sheet)
        for k, (row, img) in enumerate(chunk):
            col, line = k % COLS, k // COLS
            x, y = col * CELL, line * (CELL + LABEL_H)
            t = img.copy()
            t.thumbnail((CELL - 8, CELL - 8))
            sheet.paste(t, (x + (CELL - t.width) // 2, y + (CELL - t.height) // 2))
            draw.rectangle([x, y, x + CELL - 1, y + CELL + LABEL_H - 1], outline="#cccccc")
            draw.text((x + 4, y + CELL + 3), str(start + k), fill="black")
            index[start + k] = {
                "id": row["id"],
                "brand": row.get("brand"),
                "name": row.get("name"),
                "url": row["image_url"],
            }
        path = os.path.join(args.out, f"sheet_{start // per_sheet:02d}.png")
        sheet.save(path)

    with open(os.path.join(args.out, "index.json"), "w", encoding="utf-8") as fh:
        json.dump(index, fh, indent=0)

    sheets = (len(fetched) + per_sheet - 1) // per_sheet
    print(f"\n{sheets} sheets written to {args.out}/")
    print("Review each sheet, note the indices that are not clean pack shots,")
    print("then map them with index.json and re-source:")
    print("  python scripts/run_import.py backfill_photos.py --ids <id,id,...>")


if __name__ == "__main__":
    main()
