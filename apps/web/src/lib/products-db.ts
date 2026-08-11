// Server-only access to the products catalog in Supabase.
//
// NOTE: packages/core/src/supabase/types.ts is generated from the live
// database and doesn't include the new catalog tables until the
// 20260702000000 migration is applied and types are regenerated
// (`npx supabase gen types typescript --linked > packages/core/src/supabase/types.ts`).
// Until then this module keeps its own row types and uses an untyped client.
// Once types are regenerated, drop the cast and these interfaces.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product, ProductIngredient } from "@skinsavior/core/types";
import type { ProductExtraction } from "@skinsavior/core/schemas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isResearched } from "@skinsavior/core/research";
import { slugify } from "@/lib/ingest";
import { normalizeCategory } from "@/lib/brands-db";

/** How many products the browse/search explorer loads per page. */
export const PRODUCTS_PAGE_SIZE = 50;

const db = supabaseAdmin as unknown as SupabaseClient;

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string | null;
  origin: string | null;
  description: string | null;
  price: string | null;
  image_url: string | null;
  claims: string[];
  source: string;
  extraction_confidence: string | null;
}

interface ProductIngredientJoinRow {
  position: number;
  pct: string | null;
  is_key_active: boolean;
  ingredients: { inci_name: string; ingredient_function: string | null } | null;
}

/** Load an ingested product by slug and shape it into the shared Product type. */
export async function getDbProduct(slug: string): Promise<Product | null> {
  const { data: row, error } = await db
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<ProductRow>();
  if (error || !row) return null;

  const { data: joins } = await db
    .from("product_ingredients")
    .select("position, pct, is_key_active, ingredients(inci_name, ingredient_function)")
    .eq("product_id", row.id)
    .order("position");

  const ingredients: ProductIngredient[] = ((joins ?? []) as unknown as ProductIngredientJoinRow[])
    .filter((j) => j.ingredients)
    .map((j) => ({
      name: j.ingredients!.inci_name,
      pct: j.pct ?? undefined,
      tags: [
        ...(j.ingredients!.ingredient_function
          ? [{ label: capitalize(j.ingredients!.ingredient_function), tone: "neutral" as const }]
          : []),
        ...(j.is_key_active ? [{ label: "★ Key active", tone: "good" as const }] : []),
      ],
    }));

  // Fields the ingest pipeline doesn't produce yet (match score, evidence
  // grade, retailers, reviews) are left empty/zero; the product page hides
  // those sections when empty.
  return {
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    origin: row.origin ?? "",
    category: row.category ?? "Other",
    imageUrl: row.image_url,
    breadcrumb: `Products / ${row.category ?? "All"}`,
    tagline: row.category ?? "",
    description: row.description ?? "",
    price: row.price ?? "",
    retailerCount: 0,
    match: 0,
    matchFor: "",
    badges: row.source === "ai_extracted" ? ["⚠ AI-extracted — not yet reviewed"] : [],
    forYou: { good: [], warn: [] },
    rank: "",
    evidenceGrade: "—",
    evidenceText:
      "Evidence grading for this product hasn't run yet. The claims below are the brand's own, shown verbatim and unevaluated: " +
      (row.claims.length ? row.claims.join(" · ") : "none found."),
    ingredients,
    safety: [],
    retailers: [],
    rating: 0,
    reviewCount: 0,
    reviews: [],
  };
}

export interface ResearchIngredient {
  ingredientId: string;
  /** Display label for the toggle pill. */
  label: string;
}

/**
 * The product's ingredients that are in the research pilot allowlist, in
 * printed order, deduped. Drives the product-page research toggle; empty when
 * the product has none (e.g. legacy seed products), so the page hides the
 * section. Static demo products (not in the DB) resolve to [] here.
 */
export async function getProductResearchIngredients(
  slug: string,
): Promise<ResearchIngredient[]> {
  const { data: product } = await db
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle<{ id: string }>();
  if (!product) return [];

  const { data: joins } = await db
    .from("product_ingredients")
    .select("position, ingredient_id, ingredients(inci_name, common_name)")
    .eq("product_id", product.id)
    .order("position");

  const rows = (joins ?? []) as unknown as {
    ingredient_id: string;
    ingredients: { inci_name: string; common_name: string | null } | null;
  }[];

  const seen = new Set<string>();
  const result: ResearchIngredient[] = [];
  for (const j of rows) {
    if (!j.ingredients || seen.has(j.ingredient_id)) continue;
    if (!isResearched(j.ingredients.inci_name)) continue;
    seen.add(j.ingredient_id);
    result.push({
      ingredientId: j.ingredient_id,
      label: capitalize((j.ingredients.common_name?.trim() || j.ingredients.inci_name).trim()),
    });
  }
  return result;
}

/** Shape a bare catalog row into a Product card (no ingredient fetch). */
function rowToCard(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    origin: row.origin ?? "",
    category: row.category ?? "Other",
    imageUrl: row.image_url,
    breadcrumb: `Products / ${row.category ?? "All"}`,
    tagline: row.category ?? "",
    description: row.description ?? "",
    price: row.price ?? "",
    retailerCount: 0,
    match: 0,
    matchFor: "",
    badges: [],
    forYou: { good: [], warn: [] },
    rank: "",
    evidenceGrade: "—",
    evidenceText: "",
    ingredients: [],
    safety: [],
    retailers: [],
    rating: 0,
    reviewCount: 0,
    reviews: [],
  };
}

/**
 * Search the catalog by product name/brand/category and by ingredient name
 * (mirrors what lib/products.ts searchProducts() does for the static data).
 */
export async function searchDbProducts(q: string, limit = 24): Promise<Product[]> {
  return (await searchDbProductRows(q, limit)).map(rowToCard);
}

/** Row-level variant of searchDbProducts for callers that need product ids. */
export async function searchDbProductRows(q: string, limit = 24): Promise<ProductRow[]> {
  const safe = q.trim().replace(/[,()]/g, " ");
  if (!safe) return [];

  const { data: byText } = await db
    .from("products")
    .select("*")
    .or(`name.ilike.%${safe}%,brand.ilike.%${safe}%,category.ilike.%${safe}%`)
    .limit(limit);

  // Ingredient-name search, e.g. "niacinamide" finds products containing it.
  let byIngredient: ProductRow[] = [];
  const { data: ings } = await db
    .from("ingredients")
    .select("id")
    .ilike("inci_name", `%${safe}%`)
    .limit(5);
  if (ings?.length) {
    const { data: joins } = await db
      .from("product_ingredients")
      .select("product_id")
      .in("ingredient_id", (ings as { id: string }[]).map((i) => i.id))
      .limit(limit);
    const ids = [...new Set(((joins ?? []) as { product_id: string }[]).map((j) => j.product_id))];
    if (ids.length) {
      const { data } = await db.from("products").select("*").in("id", ids).limit(limit);
      byIngredient = (data ?? []) as ProductRow[];
    }
  }

  const seen = new Set<string>();
  const merged: ProductRow[] = [];
  for (const row of [...((byText ?? []) as ProductRow[]), ...byIngredient]) {
    if (seen.has(row.slug)) continue;
    seen.add(row.slug);
    merged.push(row);
    if (merged.length >= limit) break;
  }
  return merged;
}

/** Most recently added catalog products (for browse views without a query). */
export async function listRecentDbProducts(limit = 24): Promise<Product[]> {
  const { data } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as ProductRow[]).map(rowToCard);
}

export interface ProductCategory {
  key: string;
  label: string;
  /** Raw `products.category` values that normalize to this key. */
  rawValues: string[];
  count: number;
}

/**
 * Distinct product types for the browse filter chips, grouped by normalized
 * key (so "sunscreens" / "Sunscreen" become one "Sunscreens" chip). Sorted by
 * how many products they cover.
 */
export async function listProductCategories(): Promise<ProductCategory[]> {
  const { data } = await db.from("products").select("category");
  const rows = (data ?? []) as { category: string | null }[];

  const groups = new Map<
    string,
    { label: string; rawValues: Set<string>; count: number }
  >();
  for (const r of rows) {
    const norm = normalizeCategory(r.category);
    if (!norm || !r.category) continue;
    const g = groups.get(norm.key) ?? {
      label: norm.label,
      rawValues: new Set<string>(),
      count: 0,
    };
    g.rawValues.add(r.category);
    g.count++;
    groups.set(norm.key, g);
  }

  return [...groups]
    .map(([key, g]) => ({
      key,
      label: g.label,
      rawValues: [...g.rawValues],
      count: g.count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export interface ProductCardRow {
  slug: string;
  name: string;
  brand: string;
  origin: string | null;
  category: string | null;
  price: string | null;
  image_url: string | null;
}

export interface ProductsPage {
  rows: ProductCardRow[];
  total: number;
  hasMore: boolean;
}

/**
 * One page of catalog products, newest first, with an optional text search
 * (name / brand / ingredient name) and an optional set of raw category values
 * to filter by. `total` is the count matching the filters.
 */
export async function listDbProductsPage({
  q = "",
  rawCategories = null,
  offset = 0,
  limit = PRODUCTS_PAGE_SIZE,
}: {
  q?: string;
  rawCategories?: string[] | null;
  offset?: number;
  limit?: number;
}): Promise<ProductsPage> {
  let query = db
    .from("products")
    .select("slug, name, brand, origin, category, price, image_url", {
      count: "exact",
    });

  const needle = q.trim();
  if (needle) {
    const safe = needle.replace(/[%,()]/g, " ").trim();
    const ors = [`name.ilike.%${safe}%`, `brand.ilike.%${safe}%`];

    // Preserve ingredient→product search: match products that contain an
    // ingredient whose INCI name matches the query.
    const { data: ings } = await db
      .from("ingredients")
      .select("id")
      .ilike("inci_name", `%${safe}%`)
      .limit(5);
    if (ings?.length) {
      const { data: joins } = await db
        .from("product_ingredients")
        .select("product_id")
        .in("ingredient_id", (ings as { id: string }[]).map((i) => i.id))
        .limit(500);
      const ids = [
        ...new Set(((joins ?? []) as { product_id: string }[]).map((j) => j.product_id)),
      ];
      if (ids.length) ors.push(`id.in.(${ids.join(",")})`);
    }
    query = query.or(ors.join(","));
  }

  if (rawCategories && rawCategories.length) {
    query = query.in("category", rawCategories);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return { rows: [], total: 0, hasMore: false };

  const rows = (data ?? []) as ProductCardRow[];
  const total = count ?? rows.length;
  return { rows, total, hasMore: offset + rows.length < total };
}

/** Look up an existing product by a canonicalized source URL. */
export async function findProductByUrl(url: string): Promise<{ slug: string } | null> {
  const { data } = await db
    .from("product_sources")
    .select("products(slug)")
    .eq("url", url)
    .maybeSingle();
  const slug = (data as { products: { slug: string } | null } | null)?.products?.slug;
  return slug ? { slug } : null;
}

/** Trigram-fuzzy match against existing products; returns the best hit. */
export async function findSimilarProduct(
  brand: string,
  name: string,
): Promise<{ id: string; slug: string; sim: number } | null> {
  const { data, error } = await db.rpc("find_similar_products", {
    p_query: `${brand} ${name}`,
    p_limit: 1,
  });
  if (error || !data?.length) return null;
  return data[0] as { id: string; slug: string; sim: number };
}

export async function addProductSource(productId: string, url: string): Promise<void> {
  await db.from("product_sources").insert({ product_id: productId, url });
}

// Formula-based dedupe. Marketing titles vary wildly across retailers (the same
// medicube sunscreen is "Collagen Glow Sunscreen SPF50+" on one site and "No
// Cast Just Glow Collagen Sunscreen" on another), but the INCI list is the same
// physical product. So we key duplicate detection on brand + ingredient set
// rather than the name.

/** Below this many ingredients on either side, the fingerprint is too coarse
 *  to trust — fall back to name matching instead. */
const FINGERPRINT_MIN_INGREDIENTS = 5;
/** Jaccard overlap of the two ingredient sets at/above which they're treated as
 *  the same product. High enough that different products of the same brand
 *  (which share only common bases like water/glycerin) don't collide, low
 *  enough to tolerate a minor reformulation or one-off parsing difference. */
const FINGERPRINT_MATCH_THRESHOLD = 0.85;

type FingerprintCandidate = {
  id: string;
  slug: string;
  product_ingredients: { ingredients: { normalized_name: string } | null }[] | null;
};

/** Normalize an INCI name to the same key as ingredients.normalized_name
 *  (the DB column is `lower(btrim(inci_name))`). */
function normalizeInci(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Find an existing product that is the same physical product as the given
 * extraction, matched on brand + ingredient formula. Returns the best match
 * whose ingredient set overlaps above the threshold, or null when the
 * extraction has too few ingredients to fingerprint (caller should then fall
 * back to name-based matching).
 */
export async function findProductByIngredientFingerprint(
  brand: string,
  inciNames: string[],
): Promise<{ id: string; slug: string; overlap: number } | null> {
  const newSet = new Set(inciNames.map(normalizeInci).filter(Boolean));
  if (newSet.size < FINGERPRINT_MIN_INGREDIENTS) return null;

  // Only same-brand products are candidates. Brand is stable across retailers,
  // so this both cuts the comparison set down and prevents cross-brand merges.
  const { data, error } = await db
    .from("products")
    .select("id, slug, product_ingredients(ingredients(normalized_name))")
    .ilike("brand", brand.trim());
  if (error || !data?.length) return null;

  let best: { id: string; slug: string; overlap: number } | null = null;
  for (const c of data as unknown as FingerprintCandidate[]) {
    const candSet = new Set(
      (c.product_ingredients ?? [])
        .map((j) => j.ingredients?.normalized_name)
        .filter((n): n is string => Boolean(n)),
    );
    if (candSet.size < FINGERPRINT_MIN_INGREDIENTS) continue;

    let intersection = 0;
    for (const n of newSet) if (candSet.has(n)) intersection++;
    const union = newSet.size + candSet.size - intersection;
    const overlap = union === 0 ? 0 : intersection / union;
    if (overlap > (best?.overlap ?? 0)) {
      best = { id: c.id, slug: c.slug, overlap };
    }
  }

  return best && best.overlap >= FINGERPRINT_MATCH_THRESHOLD ? best : null;
}

/** Insert an extracted product with its ingredients; returns the new slug. */
export async function insertExtractedProduct(
  extraction: ProductExtraction,
  sourceUrl: string,
  model: string,
): Promise<string> {
  const baseSlug = slugify(`${extraction.brand} ${extraction.name}`) || "product";
  let slug = baseSlug;
  for (let attempt = 0; ; attempt++) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data } = await db.from("products").select("id").eq("slug", candidate).maybeSingle();
    if (!data) {
      slug = candidate;
      break;
    }
    if (attempt > 20) throw new Error("Couldn't allocate a unique slug.");
  }

  // Country of origin: Claude fills this from its knowledge of the brand. Reuse
  // an origin already on record for this brand so a brand doesn't drift between
  // spellings ("Korea" vs "South Korea") across its products.
  const origin = await resolveBrandOrigin(extraction.brand, extraction.origin);

  const { data: product, error: productError } = await db
    .from("products")
    .insert({
      slug,
      name: extraction.name,
      brand: extraction.brand,
      category: extraction.category,
      origin,
      description: extraction.description,
      price: extraction.price,
      claims: extraction.claims,
      source: "ai_extracted",
      extraction_model: model,
      extraction_confidence: extraction.confidence,
    })
    .select("id")
    .single();
  if (productError || !product) {
    throw new Error(`Failed to save product: ${productError?.message ?? "unknown error"}`);
  }
  const productId = (product as { id: string }).id;

  // Link each extracted ingredient in printed order, creating any the catalog
  // doesn't have yet. This is the step that grows the ingredient DB as new
  // products are ingested.
  for (let i = 0; i < extraction.ingredients.length; i++) {
    const ing = extraction.ingredients[i];
    const ingredientId = await getOrCreateIngredientId(
      ing.inci_name,
      ing.ingredient_function,
    );
    if (!ingredientId) continue;

    await db.from("product_ingredients").upsert(
      {
        product_id: productId,
        ingredient_id: ingredientId,
        position: i,
        pct: ing.pct,
        is_key_active: ing.is_key_active,
      },
      { onConflict: "product_id,ingredient_id" },
    );
  }

  await addProductSource(productId, sourceUrl);
  return slug;
}

/**
 * Resolve an ingredient row id by its normalized INCI name, inserting a new
 * `ingredients` row when the catalog doesn't have it yet. This is what appends
 * newly-seen ingredients to the DB during ingest.
 *
 * `normalized_name` is a generated column (`lower(btrim(inci_name))`) with a
 * unique index, so a concurrent ingest can win the insert race between our
 * existence check and our insert. We treat that unique violation as "already
 * there" and re-read the row rather than silently dropping the ingredient from
 * the product's list.
 */
async function getOrCreateIngredientId(
  inciName: string,
  ingredientFunction: string | null,
): Promise<string | undefined> {
  const inci = inciName.trim();
  const normalized = inci.toLowerCase();
  if (!normalized) return undefined;

  const { data: existing } = await db
    .from("ingredients")
    .select("id")
    .eq("normalized_name", normalized)
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;

  const { data: created, error } = await db
    .from("ingredients")
    .insert({ inci_name: inci, ingredient_function: ingredientFunction })
    .select("id")
    .single();
  if (created) return (created as { id: string }).id;

  // Insert failed — most likely a concurrent ingest inserted the same
  // normalized name first. Re-read it so the product still links the ingredient.
  if (error) {
    const { data: raced } = await db
      .from("ingredients")
      .select("id")
      .eq("normalized_name", normalized)
      .maybeSingle();
    return (raced as { id: string } | null)?.id;
  }
  return undefined;
}

// Common country-name variants → the canonical label we store, so filters and
// brand pages don't fragment the same country across spellings.
const COUNTRY_ALIASES: Record<string, string> = {
  "korea": "South Korea",
  "republic of korea": "South Korea",
  "korea, republic of": "South Korea",
  "s. korea": "South Korea",
  "usa": "United States",
  "u.s.": "United States",
  "u.s.a.": "United States",
  "us": "United States",
  "united states of america": "United States",
  "america": "United States",
  "uk": "United Kingdom",
  "u.k.": "United Kingdom",
  "england": "United Kingdom",
  "great britain": "United Kingdom",
};

/** Canonicalize a country name; null/blank → null. */
function normalizeCountry(raw: string | null | undefined): string | null {
  const s = raw?.trim();
  if (!s) return null;
  return COUNTRY_ALIASES[s.toLowerCase()] ?? s;
}

/**
 * Decide the origin to store for a newly-ingested product. Prefer a country
 * already recorded for this brand (keeps a brand consistent across its
 * products); otherwise fall back to the one Claude inferred for this product.
 */
async function resolveBrandOrigin(
  brand: string,
  extractedOrigin: string | null,
): Promise<string | null> {
  const trimmed = brand.trim();
  if (trimmed) {
    // `ilike` with the literal brand — escape LIKE wildcards so a brand with
    // '%' or '_' still matches itself rather than acting as a pattern.
    const pattern = trimmed.replace(/[\\%_]/g, "\\$&");
    const { data } = await db
      .from("products")
      .select("origin")
      .ilike("brand", pattern)
      .not("origin", "is", null)
      .limit(1)
      .maybeSingle();
    const existing = (data as { origin: string } | null)?.origin;
    if (existing) return normalizeCountry(existing);
  }
  return normalizeCountry(extractedOrigin);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
