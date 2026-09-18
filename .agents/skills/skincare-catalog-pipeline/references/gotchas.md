# Gotchas

Every item here cost real debugging time, and most of them looked like
reasonable code. Read before changing matching logic, queries, or regexes.

## Contents

- [PostgREST](#postgrest)
- [INCIDecoder](#incidecoder)
- [Shopify](#shopify)
- [Open Beauty Facts](#open-beauty-facts)
- [Regexes](#regexes)
- [Environment](#environment)

---

## PostgREST

### Every response is capped at 1000 rows

Anything reading a whole category or catalogue must paginate with `.range()`.

This failed in the worst possible direction. Ingredients are stored in INCI
(concentration) order, so truncation always kept the base and dropped the
tail — exactly where fragrance, essential oils and preservatives sit. Products
came back looking clean because the disqualifying ingredient was never loaded.
On one category alone that was 38 products recommended to a user who had
declared a reaction to what was in them.

```python
PAGE = 1000
for offset in range(0, 10**9, PAGE):
    page = fetch(f"...&limit={PAGE}&offset={offset}")
    if not page:
        break
    rows += page
    if len(page) < PAGE:
        break
```

Check the page length. A short page means the end; a full page never does.

### `or=(...)` splits on commas and parens *after* url-decoding

Any value going into a filter list must be double-quoted, or a comma inside it
silently breaks the query into nonsense and returns 400.

Brand names are full of commas — `Dear, Klairs`, `Henkel, Diadermine`,
`L'Oreal, L'Oreal Consumer products, Garnier` — as are INCI names
(`1,2-hexanediol`).

```python
# WRONG: 400s for any brand containing a comma
f"or=(slug.eq.{q(slug)},and(brand.eq.{q(brand)},name.eq.{q(name)}))"

# RIGHT: quote the values
f'or=(slug.eq.{q(slug)},and(brand.eq.{quoted(brand)},name.eq.{quoted(name)}))'
```

This lost all 44 products of one brand while the run reported `added: 508` and
looked like a success. Failed writes counted in a summary line are easy to
scroll past — check what the failures have in common.

---

## INCIDecoder

### Search matches on NAME, across brands

The top hit for "BYOMA Glass Skin" is `cuura-glass-skin` — a different
company's product with the same name. Accepting it stores another product's
ingredient list, which then drives scoring, clash detection and safety rules.

Always verify the brand appears in the result URL. Compare with accent folding
and substring matching, not token equality:

- `Kiehl's` tokenises to `{kiehl}` but the slug says `kiehls`
- `L'Oréal` — the accented `é` is not in `[a-z0-9]`, so it fragments entirely

### A rejection must stay visible to the caller

When the guard above rejects a wrong-brand hit, do **not** return an empty
result. That makes "found another brand's product" indistinguishable from
"nothing is indexed", and any cleanup pass reading it will skip the corrupt
row instead of fixing it.

Return a marker (`_wrong_brand`) so callers can tell the two apart. A guard
that hides its own findings is the failure-that-looks-like-absence bug,
re-introduced inside the thing meant to prevent it.

### Throttling is indistinguishable from "not indexed"

A refused request and an unindexed product both return no ingredients. Mark
the failure (`_fetch_failed`) and back off — 5s, 15s, 40s. Never record a
throttled lookup as "no ingredients"; that is silent data loss.

Base delay ~2s. Running two INCIDecoder jobs concurrently triggers throttling
partway through, which is how identical queries start returning different
answers.

### It hosts clean pack shots

`incidecoder-content.storage.googleapis.com`. Useful for brands with no
Shopify storefront (CeraVe, La Roche-Posay, The Ordinary, Paula's Choice) and
for replacing promo art. Free — the same page fetch already returns it.

---

## Shopify

### `/products.json?limit=250&page=N` is public and documented

Gives title, vendor, product_type, tags, variants (price) and images. Does
**not** give ingredient lists — measured at 0-5 products per brand carrying
INCI in `body_html`.

### `vendor` is free text

"COSRX official", "<Brand> US", "<Brand> Global". That extra word breaks
ingredient search. Keep a canonical `BRAND_NAMES` map.

### `tags` are merchandising metadata, not product typing

Never match them as free text. Real examples that broke categorisation:

| Tag | What it actually means |
|---|---|
| `free mini spf w/moisturizer` | a gift-with-purchase promo |
| `NO CHEMICAL SUNSCREEN` | a **negative** claim — contains none |
| `meta-related-products-for-spf` | related-products merchandising |
| `Moisturizers & SPF` | a collection name |
| `bundle:serum-spf-bundle` | a bundle it appears in |

Tags are only safe as a **whole value** (`tag == "sunscreen"`), which is what
rescues products whose title says nothing — a sunscreen titled "Plus One" with
`product_type: Skin Care` is identifiable only by its bare `sunscreen` tag.

Same rule for bundle detection: a product carries every collection it appears
in, so an ordinary serum tagged `skincare sets` is not a set.

### `images[0]` is whatever the brand last promoted

Regularly a campaign graphic, collab lockup, before/after composite or model
shot rather than the product. Filename rules catch some (`gwp`, `promo`,
`banner`, `before`, `after`, `bna`) but **cannot** catch a badge composited
into an otherwise normal image. That needs a vision pass.

Do not "fix" this with a filename-similarity heuristic. One that preferred
filenames resembling the product title fixed its motivating case and regressed
235 products — brands name texture swatches, two-packs and supplemental shots
after the product too.

---

## Open Beauty Facts

### Images come in sizes; the default is a thumbnail

URLs end `.400.jpg` — a 400px **long edge**. On portrait phone shots that
leaves the short edge around 150px, which renders as broken rather than merely
amateur:

```
151x400   ->  1493x3959
299x400   ->  3472x4640
```

`.full.jpg` on the same path is the original. Verify it exists with a real
request before storing — writing a 404 into `image_url` turns a poor photo
into a broken one.

### One product shot per language

The other uploads are ingredient and packaging photos. OBF gives resolution,
not studio quality.

### Products are keyed by EAN barcode

Stored as `obf_id`. Unused so far, but it is a real key into retailer
databases for brands that have no storefront.

---

## Regexes

Test every pattern against real catalogue values. These all shipped:

| Pattern | Fails on | Why |
|---|---|---|
| `\bspf\b` | `SPF50+` | no boundary between `F` and `5` |
| `\bsunscreen\b` | the `Sunscreens` tag | trailing `s` |
| `\boil\b` | `Oil Free` | matches the word it is denying |
| `coloration` | `Discoloration` | substring, not a word |
| `LIKE '%lip_%'` | `Lipid`, `Lollipop` | `_` is a SQL wildcard |

Strip negating phrases *before* matching rather than trying to express them in
the pattern:

```python
hay = re.sub(r"\boils?\s*[-–]?\s*free\b", " ", hay)
```

### Escaping through heredocs corrupts patterns

A pattern once contained a literal backspace (`0x08`) where `\b` was intended,
so it matched nothing — and `0x08` renders invisibly, so the source looked
correct. Edit regex lines directly rather than patching them through nested
shell/Python strings.

---

## Environment

### `SUPABASE_SERVICE_KEY` must be the legacy JWT

The `sb_secret_…` format is rejected. In the Supabase dashboard it is under
the "Legacy anon, service_role API keys" tab.

### A missing service key can degrade silently

If an admin client falls back to a mock when the key is unset, you get no
error — just empty data and 404s everywhere. Validate the key at startup
(`preflight()`) so the failure is loud.

### Windows exhausts ephemeral ports

Per-request connections hit `WinError 10048`. Use a pooled
`requests.Session` with an `HTTPAdapter`.

### cmd.exe keeps the quotes

`set VAR="x"` stores the quotes as part of the value. Strip them, or read the
key from a file instead — `run_import.py` does the latter.
