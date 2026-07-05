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
import { slugify } from "@/lib/ingest";

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

/** Shape a bare catalog row into a Product card (no ingredient fetch). */
function rowToCard(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    origin: row.origin ?? "",
    category: row.category ?? "Other",
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

  const { data: product, error: productError } = await db
    .from("products")
    .insert({
      slug,
      name: extraction.name,
      brand: extraction.brand,
      category: extraction.category,
      origin: extraction.origin,
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

  // Upsert ingredients by normalized name, then link them in order.
  for (let i = 0; i < extraction.ingredients.length; i++) {
    const ing = extraction.ingredients[i];
    const normalized = ing.inci_name.trim().toLowerCase();
    if (!normalized) continue;

    let ingredientId: string | undefined;
    const { data: existing } = await db
      .from("ingredients")
      .select("id")
      .eq("normalized_name", normalized)
      .maybeSingle();
    if (existing) {
      ingredientId = (existing as { id: string }).id;
    } else {
      const { data: created } = await db
        .from("ingredients")
        .insert({
          inci_name: ing.inci_name.trim(),
          ingredient_function: ing.ingredient_function,
        })
        .select("id")
        .single();
      ingredientId = (created as { id: string } | null)?.id;
    }
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
