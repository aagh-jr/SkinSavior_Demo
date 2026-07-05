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

export type BrandSort = "top" | "newest" | "az";

/** URL-safe slug from a brand name. */
export function brandSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

async function loadAllProducts(): Promise<BrandProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug, name, brand, category, origin, image_url, created_at")
    .order("brand");
  if (error) throw new Error(`Couldn't load products: ${error.message}`);
  const rows = (data ?? []) as unknown as {
    slug: string;
    name: string;
    brand: string | null;
    category: string | null;
    origin: string | null;
    image_url: string | null;
    created_at: string;
  }[];
  return rows
    .filter((r) => r.brand && r.brand.trim())
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      brand: r.brand as string,
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
  const sort = opts.sort ?? "top";
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
