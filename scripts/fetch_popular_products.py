"""
fetch_popular_products.py
-------------------------
Seeds the catalog with popular skincare products, using two free,
deterministic sources — no LLM, no paid API:

  brand site JSON-LD  ->  name, brand, price, description, studio photo
  INCIDecoder         ->  full INCI list, in order (+ fallback photo)

Products are matched to EXISTING ingredient rows wherever possible, so this
mostly adds links rather than new ingredients.

Usage
-----
  # See what would be written, no DB access, no credentials needed:
  python scripts/fetch_popular_products.py --dry-run --limit 5

  # Write to Supabase (needs the service_role key — RLS blocks anon writes):
  set SUPABASE_SERVICE_KEY=eyJ...        (Windows cmd)
  $env:SUPABASE_SERVICE_KEY="eyJ..."     (PowerShell)
  python scripts/fetch_popular_products.py

Re-running is safe: products already present (matched by slug) are skipped.
"""

import argparse
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from popular_catalog import CATALOG, BRAND_DOMAINS  # noqa: E402


def make_session() -> requests.Session:
    """Session with keep-alive + retries.

    Without connection reuse Windows runs out of ephemeral ports
    (WinError 10048) — every request would open a fresh socket and each one
    lingers in TIME_WAIT for ~2 minutes.
    """
    s = requests.Session()
    retry = Retry(
        total=4,
        backoff_factor=1.5,               # 0s, 1.5s, 3s, 6s
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET", "POST", "PATCH", "DELETE"),
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=20)
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    return s


SESSION = make_session()

SUPABASE_URL = "https://vltvclhxrjroecjnugpu.supabase.co"

# cmd.exe keeps surrounding quotes as part of the value (set K="abc" -> '"abc"'),
# which silently produces a 401. Strip them, plus any stray whitespace/newline.
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "").strip().strip('"').strip("'").strip()

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
HEADERS = {"User-Agent": UA, "Accept": "text/html,application/xhtml+xml"}
SLEEP = 1.2  # polite pause between outbound page fetches


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------

def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text.lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:80]


def fetch(url: str, timeout: int = 25) -> str | None:
    try:
        r = SESSION.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        if r.status_code != 200:
            return None
        return r.text
    except Exception:
        return None


# --------------------------------------------------------------------------
# source 1: brand site JSON-LD  ->  image, price, description
# --------------------------------------------------------------------------

def _collect_products(node, out):
    if isinstance(node, dict):
        if node.get("@type") in ("Product", "ProductGroup"):
            out.append(node)
        for v in node.values():
            _collect_products(v, out)
    elif isinstance(node, list):
        for v in node:
            _collect_products(v, out)


def scrape_brand_page(url: str) -> dict:
    """Pull schema.org Product data from a brand's own product page."""
    html = fetch(url)
    if not html:
        return {}

    blocks = re.findall(
        r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html, re.S | re.I,
    )
    found = []
    for b in blocks:
        try:
            _collect_products(json.loads(b), found)
        except Exception:
            pass

    out = {}
    if found:
        p = found[0]
        img = p.get("image")
        if isinstance(img, list) and img:
            img = img[0]
        if isinstance(img, dict):
            img = img.get("url")
        if isinstance(img, str):
            out["image_url"] = img

        desc = p.get("description")
        if isinstance(desc, str) and desc.strip():
            out["description"] = re.sub(r"\s+", " ", desc).strip()[:1000]

        offers = p.get("offers")
        if isinstance(offers, list) and offers:
            offers = offers[0]
        if isinstance(offers, dict):
            price, cur = offers.get("price"), offers.get("priceCurrency")
            if price:
                symbol = {"USD": "$", "EUR": "€", "GBP": "£"}.get(cur, "")
                out["price"] = f"{symbol}{price}" if symbol else f"{price} {cur or ''}".strip()

    # og:image is a reliable fallback when JSON-LD omits the photo
    if "image_url" not in out:
        m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', html, re.I)
        if m:
            out["image_url"] = m.group(1)

    return out


# --------------------------------------------------------------------------
# source 1b: brand Shopify storefront  ->  studio photo + price
#
# Shopify exposes /search/suggest.json on every storefront. One domain per
# brand therefore covers all of that brand's products — no per-product URL
# needed, which is what makes good photography scale here.
# --------------------------------------------------------------------------

def scrape_shopify(domain: str, product_name: str) -> dict:
    url = (
        f"https://{domain}/search/suggest.json"
        f"?q={urllib.parse.quote(product_name)}"
        "&resources[type]=product&resources[limit]=5"
    )
    try:
        r = SESSION.get(
            url,
            headers={"User-Agent": UA, "Accept": "application/json"},
            timeout=15,
        )
        if r.status_code != 200:
            return {}
        hits = r.json().get("resources", {}).get("results", {}).get("products", [])
    except Exception:
        return {}
    if not hits:
        return {}

    # Prefer a hit whose title shares the most words with what we asked for —
    # the first result is not always the right variant.
    wanted = set(re.findall(r"[a-z0-9]+", product_name.lower()))
    best = max(
        hits,
        key=lambda h: len(wanted & set(re.findall(r"[a-z0-9]+", (h.get("title") or "").lower()))),
    )

    out = {}
    img = best.get("featured_image") or best.get("image")
    if isinstance(img, dict):
        img = img.get("url")
    if isinstance(img, str) and img.startswith("http"):
        out["image_url"] = img.split("?")[0]

    price = best.get("price")
    if price:
        try:
            out["price"] = f"${float(price):.2f}"
        except (TypeError, ValueError):
            pass
    return out


# --------------------------------------------------------------------------
# source 2: INCIDecoder  ->  ordered INCI list (+ fallback image)
# --------------------------------------------------------------------------

def scrape_incidecoder(query: str) -> dict:
    """Search INCIDecoder, open the top product hit, return its INCI list."""
    search_html = fetch("https://incidecoder.com/search?query=" + urllib.parse.quote(query))
    if not search_html:
        # Request FAILED (throttled, timeout, reset) — not the same as "this
        # product isn't indexed". Callers that conflate the two silently drop
        # products that do exist, so mark it and let them retry.
        return {"_fetch_failed": True}

    links = [
        l for l in re.findall(r'href="(/products/[^"#?]+)"', search_html)
        if l != "/products/create"
    ]
    if not links:
        return {}

    page = fetch("https://incidecoder.com" + links[0])
    if not page:
        return {"_fetch_failed": True}

    # Each INCI entry is a link to its ingredient page; order is the INCI order.
    ordered, seen = [], set()
    for _slug, label in re.findall(r'href="/ingredients/([^"#?]+)"[^>]*>([^<]+)<', page):
        name = re.sub(r"\s+", " ", label).strip()
        key = name.lower()
        if name and key not in seen:
            seen.add(key)
            ordered.append(name)

    out = {"ingredients": ordered, "source_url": "https://incidecoder.com" + links[0]}

    m = re.search(r'(https://incidecoder-content\.storage\.googleapis\.com/[^"\']+?\.(?:jpe?g|png|webp))', page, re.I)
    if m:
        out["fallback_image"] = m.group(1)
    return out


# --------------------------------------------------------------------------
# Supabase writes (PostgREST directly — service_role bypasses RLS)
# --------------------------------------------------------------------------

class Db:
    def __init__(self, key: str):
        self.base = f"{SUPABASE_URL}/rest/v1"
        self.h = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

    def _get(self, path: str):
        r = SESSION.get(f"{self.base}/{path}", headers=self.h, timeout=30)
        r.raise_for_status()
        return r.json()

    def _post(self, path: str, payload, prefer="return=representation"):
        h = dict(self.h)
        h["Prefer"] = prefer
        r = SESSION.post(f"{self.base}/{path}", headers=h, json=payload, timeout=45)
        if r.status_code >= 300:
            raise RuntimeError(f"{r.status_code} {r.text[:300]}")
        return r.json() if r.text.strip() else []

    def find_product(self, slug: str, brand: str, name: str):
        """Locate an existing row by slug OR by (brand, name).

        The table carries a `unique (brand, name)` constraint, so a slug-only
        check isn't enough — an Open Beauty Facts seed row can hold the same
        brand+name under a different slug and the insert would 409.
        """
        # One request, not two: slug match OR (brand AND name) match.
        q = (
            "products?select=id&or=("
            f"slug.eq.{urllib.parse.quote(slug)},"
            f"and(brand.eq.{urllib.parse.quote(brand)},name.eq.{urllib.parse.quote(name)})"
            ")"
        )
        rows = self._get(q)
        return rows[0]["id"] if rows else None

    def insert_product(self, row: dict) -> str:
        return self._post("products", row)[0]["id"]

    def patch_product(self, product_id: str, row: dict):
        if not row:
            return
        h = dict(self.h)
        h["Prefer"] = "return=minimal"
        r = SESSION.patch(
            f"{self.base}/products?id=eq.{product_id}", headers=h, json=row, timeout=45
        )
        if r.status_code >= 300:
            raise RuntimeError(f"{r.status_code} {r.text[:300]}")

    @staticmethod
    def _in_list(values) -> str:
        """Build a PostgREST in.(...) list.

        Values must be double-quoted — real INCI names contain commas
        ('1,2-hexanediol') which would otherwise split the list.
        """
        quoted = ['"' + v.replace('\\', '\\\\').replace('"', '\\"') + '"' for v in values]
        return urllib.parse.quote("(" + ",".join(quoted) + ")", safe="")

    def resolve_ingredients(self, names: list[str]) -> dict:
        """Map INCI name -> id for a whole product in a couple of requests.

        Previously this ran one SELECT (plus maybe an INSERT) per ingredient,
        so a 60-ingredient product opened ~120 sockets and exhausted Windows'
        ephemeral port range.
        """
        norms = []
        for n in names:
            k = n.strip().lower()
            if k and k not in norms:
                norms.append(k)
        if not norms:
            return {}

        found = {}
        CHUNK = 40
        for i in range(0, len(norms), CHUNK):
            batch = norms[i:i + CHUNK]
            rows = self._get(
                f"ingredients?normalized_name=in.{self._in_list(batch)}"
                "&select=id,normalized_name"
            )
            for r in rows:
                found[r["normalized_name"]] = r["id"]

        missing = [n for n in names if n.strip().lower() not in found]
        if missing:
            seen, payload = set(), []
            for n in missing:
                k = n.strip().lower()
                if k not in seen:
                    seen.add(k)
                    payload.append({"inci_name": n.strip()})
            try:
                self._post(
                    "ingredients?on_conflict=normalized_name",
                    payload,
                    prefer="resolution=merge-duplicates,return=representation",
                )
            except Exception:
                pass  # re-select below picks up whatever landed

            still = [n.strip().lower() for n in missing]
            for i in range(0, len(still), CHUNK):
                batch = still[i:i + CHUNK]
                rows = self._get(
                    f"ingredients?normalized_name=in.{self._in_list(batch)}"
                    "&select=id,normalized_name"
                )
                for r in rows:
                    found[r["normalized_name"]] = r["id"]

        return found

    def link_ingredients(self, product_id: str, ingredient_ids: list[str], replace=False):
        """Attach the INCI list in order.

        `replace=True` clears existing links first. Needed when enriching an
        Open Beauty Facts row: its ingredients were parsed from a messy label
        string ('aqua', 'sodium benzoate citric acid. fil1747v00') and are
        different ingredient rows than the clean ones, so an upsert would
        leave the stale entries behind alongside the new list.
        """
        if replace:
            h = dict(self.h)
            h["Prefer"] = "return=minimal"
            r = SESSION.delete(
                f"{self.base}/product_ingredients?product_id=eq.{product_id}",
                headers=h, timeout=45,
            )
            if r.status_code >= 300:
                raise RuntimeError(f"delete links: {r.status_code} {r.text[:200]}")

        rows = [
            {"product_id": product_id, "ingredient_id": iid, "position": i}
            for i, iid in enumerate(ingredient_ids, start=1)
        ]
        if rows:
            self._post(
                "product_ingredients?on_conflict=product_id,ingredient_id",
                rows,
                prefer="resolution=merge-duplicates,return=minimal",
            )


# --------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------

def preflight(key: str):
    """Fail fast with a specific diagnosis instead of a bare 401 mid-run."""
    import base64

    if key.startswith("sb_secret_") or key.startswith("sb_publishable_"):
        sys.exit(
            "That's a NEW-format key, which PostgREST rejects here.\n"
            "Use the legacy JWT instead: Supabase -> Settings -> API ->\n"
            "'Legacy anon, service_role API keys' tab -> service_role.\n"
            "It starts with 'eyJhbGci' and is very long."
        )

    role = None
    parts = key.split(".")
    if len(parts) == 3:
        try:
            body = parts[1] + "=" * (-len(parts[1]) % 4)
            role = json.loads(base64.urlsafe_b64decode(body)).get("role")
        except Exception:
            pass

    if role is None:
        sys.exit(
            f"SUPABASE_SERVICE_KEY doesn't look like a JWT (length {len(key)}).\n"
            "In cmd.exe do NOT wrap it in quotes:\n"
            "  set SUPABASE_SERVICE_KEY=eyJhbGci...\n"
            "In PowerShell you DO need quotes:\n"
            '  $env:SUPABASE_SERVICE_KEY="eyJhbGci..."'
        )

    if role != "service_role":
        sys.exit(
            f"That key has role '{role}', but writes need 'service_role'.\n"
            "RLS makes products/ingredients read-only for anon.\n"
            "Copy the service_role key from the same Supabase page."
        )

    r = SESSION.get(
        f"{SUPABASE_URL}/rest/v1/products?select=id&limit=1",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
        timeout=20,
    )
    if r.status_code != 200:
        sys.exit(f"Supabase rejected the key ({r.status_code}): {r.text[:200]}")
    print("service_role key OK\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="scrape only, write nothing")
    ap.add_argument("--limit", type=int, default=0, help="only process the first N products")
    ap.add_argument("--only", default="", metavar="TEXT",
                    help="only products whose brand/name contains TEXT (case-insensitive)")
    args = ap.parse_args()

    items = CATALOG
    if args.only:
        needle = args.only.lower()
        items = [i for i in items if needle in f"{i['brand']} {i['name']}".lower()]
        if not items:
            sys.exit(f"No catalog entry matches {args.only!r}.")
    if args.limit:
        items = items[: args.limit]

    db = None
    if not args.dry_run:
        if not SERVICE_KEY:
            sys.exit(
                "SUPABASE_SERVICE_KEY is not set.\n"
                "RLS makes products/ingredients read-only for the anon key, so writes\n"
                "need the service_role key (Supabase -> Settings -> API ->\n"
                "'Legacy anon, service_role API keys' tab -> service_role).\n\n"
                "Or run with --dry-run to test scraping without writing."
            )
        preflight(SERVICE_KEY)
        db = Db(SERVICE_KEY)

    added = skipped = failed = 0

    for i, item in enumerate(items, start=1):
        brand, name = item["brand"], item["name"]
        label = f"{brand} {name}"
        slug = slugify(label)
        print(f"[{i}/{len(items)}] {label}")

        existing = db.find_product(slug, brand, name) if db else None

        # --- ingredients (required: a product with no INCI list is useless here)
        inci = scrape_incidecoder(item.get("search") or label)
        time.sleep(SLEEP)
        ingredients = inci.get("ingredients", [])
        if not ingredients:
            print("      no INCI list found on INCIDecoder - skipping")
            failed += 1
            continue

        # --- brand-site metadata (optional, but this is the good photo).
        # Shopify storefront first (covers a whole brand from one domain),
        # then an exact product URL if the catalog supplies one.
        meta = {}
        domain = BRAND_DOMAINS.get(brand)
        if domain:
            meta = scrape_shopify(domain, name)
            time.sleep(SLEEP)
        if not meta.get("image_url") and item.get("url"):
            page_meta = scrape_brand_page(item["url"])
            time.sleep(SLEEP)
            meta = {**page_meta, **meta}  # keep Shopify price if we got one

        brand_image = meta.get("image_url")          # studio shot — always an upgrade
        image = brand_image or inci.get("fallback_image")
        img_src = "brand" if brand_image else ("incidecoder" if image else "none")
        print(f"      {len(ingredients)} ingredients | image: {img_src}"
              + (f" | {meta['price']}" if meta.get("price") else ""))

        if args.dry_run:
            added += 1
            continue

        try:
            resolved = db.resolve_ingredients(ingredients)
            ids = [
                resolved[k] for k in (i.strip().lower() for i in ingredients)
                if k in resolved
            ]

            if existing:
                # Already in the catalog (usually an Open Beauty Facts seed row).
                # Enrich rather than duplicate: attach the real INCI list, and
                # only replace the photo when we have a brand studio shot —
                # never swap one amateur photo for another.
                patch = {
                    "raw_ingredients": ", ".join(ingredients),
                    "category": item.get("category"),
                    "product_type": item.get("category"),
                }
                if brand_image:
                    patch["image_url"] = brand_image
                if meta.get("price"):
                    patch["price"] = meta["price"]
                if meta.get("description"):
                    patch["description"] = meta["description"]
                db.patch_product(existing, patch)
                db.link_ingredients(existing, ids, replace=True)
                print(f"      enriched existing row ({len(ids)} ingredients linked)")
                skipped += 1
            else:
                row = {
                    "brand": brand,
                    "name": name,
                    "slug": slug,
                    "category": item.get("category"),
                    "product_type": item.get("category"),
                    "image_url": image,
                    "description": meta.get("description"),
                    "price": meta.get("price"),
                    "source": "seed",
                    "raw_ingredients": ", ".join(ingredients),
                }
                row = {k: v for k, v in row.items() if v is not None}
                pid = db.insert_product(row)
                db.link_ingredients(pid, ids)
                print(f"      saved ({len(ids)} ingredients linked)")
                added += 1
        except Exception as e:
            msg = str(e)
            # Transient network/socket trouble: pause and retry this product
            # once rather than losing it from the run.
            if "10048" in msg or "Max retries" in msg or "Connection" in msg:
                print("      connection hiccup - cooling down 20s, retrying once")
                time.sleep(20)
                try:
                    resolved = db.resolve_ingredients(ingredients)
                    ids = [
                        resolved[k] for k in (i.strip().lower() for i in ingredients)
                        if k in resolved
                    ]
                    pid = existing or db.insert_product({
                        "brand": brand, "name": name, "slug": slug,
                        "category": item.get("category"),
                        "product_type": item.get("category"),
                        "image_url": image, "source": "seed",
                        "raw_ingredients": ", ".join(ingredients),
                    })
                    db.link_ingredients(pid, ids, replace=bool(existing))
                    print(f"      recovered ({len(ids)} ingredients linked)")
                    added += 1
                    continue
                except Exception as e2:
                    msg = str(e2)
            print(f"      DB error: {msg[:160]}")
            failed += 1

    print("\n" + "=" * 56)
    verb = "would add" if args.dry_run else "added"
    print(f"{verb}: {added} | skipped: {skipped} | failed: {failed}")


if __name__ == "__main__":
    main()
