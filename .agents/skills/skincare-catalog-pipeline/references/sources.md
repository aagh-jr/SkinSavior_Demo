# Data sources

What each source gives you, what it does not, and where it stands legally.
Measured shares are from a ~1,750-product catalogue.

## Summary

| Source | Gives | Share of photos | Licensing |
|---|---|---|---|
| Brand Shopify storefronts | photo, price, description, type, tags | 67% | brand's copyright |
| Open Beauty Facts | photo, barcode, transcribed INCI | 20% | **CC-BY-SA** |
| INCIDecoder | ordered INCI list, pack shot | 10% | their copies of brand imagery |

---

## Brand Shopify storefronts

**Endpoint:** `https://{domain}/products.json?limit=250&page=N` — public and
documented by Shopify.

**Gives:** title, vendor, `product_type`, tags, variants (price), and images
at real resolution. This is the best source for everything except ingredients.

**Does not give:** ingredient lists. Measured at 0-5 products per brand
carrying INCI in `body_html` — not enough to rely on.

**Coverage:** roughly half of candidate brands run Shopify. Notable misses,
all on custom platforms: CeraVe, La Roche-Posay, The Ordinary, Paula's Choice,
Drunk Elephant, Purito, Isntree, Good Molecules, SOME BY MI. Those need
INCIDecoder for both INCI and photos.

**Licensing:** the brand's own product photography. Using it in a product
index is what every retailer, price-comparison site and Google Shopping does.
Normal industry practice, not explicitly licensed. Low risk; a brand that
objected would ask you to stop.

---

## Open Beauty Facts

**Endpoint:** `https://world.openbeautyfacts.org/api/v2/product/{barcode}.json`

**Gives:** crowd-uploaded photos, EAN barcodes, and INCI transcribed from the
physical carton. Strong on European retail and supermarket own-label, which
storefront scraping cannot reach at all.

**Does not give:** studio photography. These are photographs of bottles on
kitchen counters. It also holds only one product shot per language — the extra
uploads are ingredient and packaging photos, so OBF gives you resolution, not
quality.

**Watch for:** the default `.400.jpg` is a thumbnail. See `gotchas.md`.

**Licensing:** **CC-BY-SA.** The cleanest position of the three, and the only
one that comes with an explicit grant. It requires attribution — if you use
OBF images or data, credit Open Beauty Facts.

---

## INCIDecoder

**Endpoint:** `https://incidecoder.com/search?query=…` then the product page.

**Gives:** the ordered INCI list — the thing nothing else provides reliably —
plus a clean pack shot on `incidecoder-content.storage.googleapis.com`.

**Does not give:** prices, descriptions, or any structured product typing.

**Two hard constraints**, both in `gotchas.md`:

1. Search matches on product **name across brands**, so results must be
   brand-verified before use. Unguarded, this attached another brand's formula
   to ~13% of imported products.
2. It throttles, and a refused request is indistinguishable from an unindexed
   product unless you mark it.

**Licensing and courtesy:** hotlinking their storage bucket means they serve
bandwidth for your page views, on top of already providing the ingredient data
the whole index depends on. They are a small operation. If a meaningful share
of your photos come from them, copy the files into your own storage rather
than hotlinking.

---

## Ruled out

**Olive Young** — blocked entirely by bot protection, and the imagery is
copyrighted. Not available, and not needed: the brands publish the same shots
on their own storefronts.

---

## Untapped

**Retailer sites by EAN barcode.** Around 440 products in the reference
catalogue carry `obf_id`, and the brands stranded without photos are mostly
European supermarket own-label — dm, Rossmann, Carrefour, Lidl — where the
retailer *is* the manufacturer and publishes clean pack shots searchable by
barcode. This is the highest-yield remaining source, but check image licensing
before pulling at scale; that is exactly what ruled Olive Young out.

---

## A note on hotlinking

The pipeline stores image **URLs**, not copies. Nothing is downloaded into
your storage. That cuts both ways:

- You are not redistributing anyone's files, which is the cleaner position.
- Every image is a live dependency on someone else's CDN. If a brand
  reorganises their files, those images 404 with no warning.

Copying images into your own storage fixes the fragility and the bandwidth
imposition, but moves you from linking to hosting — a stronger copyright
posture, not a weaker one. Worth deciding deliberately rather than drifting
into either.
