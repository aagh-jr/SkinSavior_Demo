import { fetchAllPages } from "@skinsavior/core/query";
// Brand pages, derived entirely from the products table (no brands table yet).
//
// A "brand" is a distinct value of products.brand. We group products by a
// case-insensitive brand key, build a URL slug from the name, and surface the
// group as a brand page. Origin is derived from the brand's products; there's
// no per-brand description or uploaded logo in the schema, so pages use a
// letter monogram and a derived stats line. (A future `brands` metadata table
// could add real descriptions/logos.)

import { createClient } from "@/lib/supabase/server";

export interface BrandProduct {
  slug: string;
  name: string;
  brand: string;
  category: string | null;
  origin: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface BrandSummary {
  slug: string;
  name: string;
  origin: string | null;
  productCount: number;
  categories: string[]; // normalized display labels, deduped
  sampleImage: string | null;
}

export type BrandSort = "newest" | "az";

/** URL-safe slug from a brand name. */
export function brandSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Hand-reviewed aliases for `products.brand` values that are the same real
 * brand but DON'T already collapse under `brandSlug()`'s case/punctuation
 * normalization — genuine scraper typos or formatting drift, each verified
 * against the live catalogue before being added here (see the brand-cleanup
 * investigation, 2026-08-27: 343 distinct brand strings, ~18 already merge by
 * slug alone; this list is the next layer for near-misses slug can't catch).
 *
 * Deliberately NOT automated (no fuzzy-match auto-merge): brand identity
 * feeds attribution and search, and two similar names can be genuinely
 * different companies ("OMBIA SUN" vs "Ombra" — Aldi vs. an unrelated brand,
 * one letter apart, correctly NOT in this list). Every entry here is a
 * confirmed duplicate, not a guess.
 *
 * Keyed by `brandSlug(raw value)` so matching is case/punctuation-insensitive
 * on the input side; value is the canonical display name to show instead.
 * This changes only what renders — `products.brand` in the database is
 * untouched, so it's reversible by editing this file.
 */
const BRAND_ALIASES: Record<string, string> = {
  // One-letter scraper typo: "Nutrogena" is not a real skincare brand.
  nutrogena: "Neutrogena",
  // Same brand, three spacing/casing variants across import batches.
  "sun-ozon": "Sun Ozon",
  sunozon: "Sun Ozon",
  // Redundant "dmp" abbreviation suffix on an otherwise-matching name.
  "du-monde-la-provence-dmp": "du monde à la Provence",
};

/** Canonical brand name for a raw `products.brand` value — resolves known
 *  aliases (see `BRAND_ALIASES`); otherwise returns the value unchanged. */
export function canonicalBrand(raw: string): string {
  return BRAND_ALIASES[brandSlug(raw)] ?? raw;
}

/** Normalize a raw product category into a stable key + display label. */
export function normalizeCategory(raw: string | null): { key: string; label: string } | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase().replace(/[-_]+/g, " ");
  if (!cleaned) return null;
  // Singularize a trailing "s" so "serums" and "serum" group together.
  const key = cleaned.replace(/s\b/g, "").replace(/\s+/g, " ").trim() || cleaned;
  const label = key
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
  // Pluralize the label for a nicer chip ("Serums", "Sunscreens").
  return { key, label: label.endsWith("s") ? label : `${label}s` };
}

// Most frequent non-null value in a list (ties → first seen).
function mostCommon<T>(values: (T | null | undefined)[]): T | null {
  const counts = new Map<T, number>();
  for (const v of values) {
    if (v == null) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: T | null = null;
  let bestN = 0;
  for (const [v, n] of counts) {
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  }
  return best;
}

/**
 * Every catalogue product, PAGINATED.
 *
 * PostgREST caps a response at 1000 rows. The catalogue passed that some time
 * ago, so an unpaginated read silently returned the first 1000 ordered by
 * brand — dropping every brand late in the alphabet from the A-Z index and
 * undercounting the ones on the boundary. Same failure that was hiding safety
 * exclusions in the category ranking: truncation looks exactly like "there
 * isn't any more".
 */
async function loadAllProducts(): Promise<BrandProduct[]> {
  const supabase = await createClient();
  const rows = await fetchAllPages<{
    slug: string;
    name: string;
    brand: string | null;
    category: string | null;
    origin: string | null;
    image_url: string | null;
    created_at: string;
  }>((from, to) => supabase
      .from("products")
      .select("slug, name, brand, category, origin, image_url, created_at")
      // Out-of-scope products are flagged, not deleted (migration
      // 20260816000000). NULL = visible.
      .is("excluded_reason", null)
      .order("brand").order("id")
      .range(from, to));
  return rows
    .filter((r) => r.brand && r.brand.trim())
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      brand: canonicalBrand(r.brand as string),
      category: r.category,
      origin: r.origin,
      imageUrl: r.image_url,
      createdAt: r.created_at,
    }));
}

// Group products by URL slug (not raw name), so brands whose names differ only
// by accents/punctuation — which collapse to the same slug — share one page and
// one unique key. Falls back to the lowercased name if a name has no slug chars.
function groupByBrand(products: BrandProduct[]): Map<string, BrandProduct[]> {
  const groups = new Map<string, BrandProduct[]>();
  for (const p of products) {
    const key = brandSlug(p.brand) || p.brand.trim().toLowerCase();
    const arr = groups.get(key);
    if (arr) arr.push(p);
    else groups.set(key, [p]);
  }
  return groups;
}

function displayName(items: BrandProduct[]): string {
  return mostCommon(items.map((i) => i.brand)) ?? items[0].brand;
}

/** All brands, sorted by product count desc then name. */
export async function listBrands(): Promise<BrandSummary[]> {
  const products = await loadAllProducts();
  const groups = groupByBrand(products);
  const brands: BrandSummary[] = [];
  for (const [slug, items] of groups) {
    const name = displayName(items);
    const categories = Array.from(
      new Map(
        items
          .map((i) => normalizeCategory(i.category))
          .filter((c): c is { key: string; label: string } => !!c)
          .map((c) => [c.key, c.label] as const),
      ).values(),
    );
    brands.push({
      slug,
      name,
      origin: mostCommon(items.map((i) => i.origin)),
      productCount: items.length,
      categories,
      sampleImage: items.find((i) => i.imageUrl)?.imageUrl ?? null,
    });
  }
  brands.sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name));
  return brands;
}

export interface BrandPage {
  slug: string;
  name: string;
  origin: string | null;
  productCount: number;
  /** Distinct normalized categories present, for filter chips. */
  categories: { key: string; label: string }[];
  products: BrandProduct[];
}

/**
 * One brand's page: header info + its products, filtered by category and
 * sorted. Null when no brand matches the slug.
 */
export async function getBrandPage(
  slug: string,
  opts: { category?: string; sort?: BrandSort } = {},
): Promise<BrandPage | null> {
  const products = await loadAllProducts();
  const groups = groupByBrand(products);

  // Slug is the group key, so this is a direct lookup.
  const match = groups.get(slug) ?? null;
  if (!match) return null;

  const name = displayName(match);

  // Distinct categories for the filter chips.
  const categories = Array.from(
    new Map(
      match
        .map((i) => normalizeCategory(i.category))
        .filter((c): c is { key: string; label: string } => !!c)
        .map((c) => [c.key, c] as const),
    ).values(),
  ).sort((a, b) => a.label.localeCompare(b.label));

  // Optional category filter.
  let visible = match;
  if (opts.category) {
    visible = match.filter(
      (i) => normalizeCategory(i.category)?.key === opts.category,
    );
  }

  // Sort. "top" would rank by rating, but product_ratings is empty for now, so
  // it falls back to newest — swap in a ratings join when reviews exist.
  const sorted = [...visible];
  const sort = opts.sort ?? "newest";
  if (sort === "az") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // "top" (no ratings yet) and "newest" both order newest-first.
    sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return {
    slug,
    name,
    origin: mostCommon(match.map((i) => i.origin)),
    productCount: match.length,
    categories,
    products: sorted,
  };
}
