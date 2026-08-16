/**
 * Upgrade catalog image URLs to the highest-quality variant each host offers.
 *
 * We stored whatever URL the source handed us, and both major sources default
 * to a small thumbnail — Open Beauty Facts to a 400px JPEG (~20 KB, visibly
 * soft at any real display size) and Shopify to a 450px WebP. Both serve much
 * better versions from a predictable URL, so this is a rewrite rather than a
 * re-scrape:
 *
 *   OBF      front_en.8.400.jpg  ->  front_en.8.full.jpg   (20 KB -> ~950 KB)
 *   Shopify  ..._450x450.webp    ->  ..._1200x1200.webp    (10 KB -> ~48 KB)
 *
 * The raw OBF full-size file is far too heavy to ship to a browser, so callers
 * must render these through next/image, which resizes and re-encodes to the
 * display size. That is why next.config.ts declares remotePatterns for these
 * hosts.
 *
 * Pure and defensive: an unrecognised URL is returned untouched, so a new
 * image source degrades to the quality we already had rather than breaking.
 */
export function highResImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Open Beauty Facts: the numeric segment before the extension is the width.
  // `.full` is the original upload. There is no `.800`, so it's 400 or full.
  if (url.includes("openbeautyfacts.org")) {
    return url.replace(/\.(\d+)\.(jpg|jpeg|png|webp)$/i, ".full.$2");
  }

  // Shopify CDN: `_WxH` before the extension. 1200 is a good ceiling — beyond
  // it file size climbs without visible benefit at our display sizes.
  if (url.includes("cdn.shopify.com") || url.includes("/cdn/shop/")) {
    return url.replace(/_(\d+)x(\d+)?\.(jpg|jpeg|png|webp)/i, "_1200x1200.$3");
  }

  // INCIDecoder: stored as a 300x300 thumbnail (~10 KB, the softest images in
  // the catalogue). `_original.webp` is the full upload at ~75 KB. Always
  // .webp — `_original.jpg` 404s on this host, only `.jpeg` and `.webp` exist,
  // and webp is the smaller of the two.
  if (url.includes("incidecoder-content.storage.googleapis.com")) {
    return url.replace(/_(\d+)x(\d+)(@\d+x)?\.(jpg|jpeg|png|webp)$/i, "_original.webp");
  }

  return url;
}
