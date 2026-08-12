// Bridges the pure match scorer (@skinsavior/core/scoring) to Supabase.
//
// Mirrors the grading-db.ts split: the engine stays pure and testable, this
// module does the I/O. Nothing here decides a score — it loads the signed-in
// user's quiz profile and a product's INCI list, hands both to scoreProduct,
// and returns the result unchanged.
//
// Scores are computed per request rather than stored. They depend on the
// user's profile, so a stored column would be wrong for everyone but its
// author, and stale the moment someone retakes the quiz.

import {
  rankProducts,
  scoreProduct,
  type MatchResult,
  type ScorableProduct,
  type SkinProfile,
} from "@skinsavior/core/scoring";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Catalog reads go through the ordinary (anon-key) client, NOT the
 * service-role admin client.
 *
 * products / ingredients / product_ingredients are public-read under RLS
 * (migration 20260626130000), so scoring needs no elevated privilege — and
 * asking for one would make the whole feature depend on SUPABASE_SERVICE_ROLE_KEY
 * being configured, which silently degrades to a mock client when it isn't.
 *
 * The cast is the same workaround products-db.ts documents: the generated
 * types predate slug / price / canonical_category on products. Drop it after
 *   npx supabase gen types typescript --linked > packages/core/src/supabase/types.ts
 */
async function catalogDb(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

/**
 * The signed-in user's quiz answers, or null when signed out / not taken.
 *
 * Read through the cookie-aware client so RLS enforces own-row access — the
 * quiz profile holds health information (pregnancy, prescriptions) and must
 * never be readable through the service-role path.
 */
export async function getMyProfile(): Promise<SkinProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(
      "skin_type, sensitivity, pigmentation, aging_concern, pregnancy_status, medications, reactions, current_routine",
    )
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;

  const row = data as Record<string, unknown>;
  const str = (k: string) => (typeof row[k] === "string" ? (row[k] as string) : null);
  const arr = (k: string) => (Array.isArray(row[k]) ? (row[k] as string[]) : null);

  return {
    skinType: str("skin_type"),
    sensitivity: str("sensitivity"),
    pigmentation: str("pigmentation"),
    agingConcern: str("aging_concern"),
    pregnancyStatus: str("pregnancy_status"),
    medications: arr("medications"),
    reactions: arr("reactions"),
    currentRoutine: arr("current_routine"),
  };
}

/** True when a profile carries enough signal for a score to mean anything. */
export function isScorable(profile: SkinProfile | null): profile is SkinProfile {
  if (!profile) return false;
  return Boolean(
    profile.skinType ||
      profile.sensitivity ||
      profile.pigmentation ||
      profile.agingConcern ||
      profile.reactions?.length,
  );
}

interface IngredientJoinRow {
  position: number;
  ingredients: { inci_name: string; functions: string[] | null } | null;
}

/** Load one product's INCI list in concentration order. */
async function loadIngredients(productId: string) {
  const db = await catalogDb();
  const { data } = await db
    .from("product_ingredients")
    .select("position, ingredients(inci_name, functions)")
    .eq("product_id", productId)
    .order("position");

  return ((data ?? []) as unknown as IngredientJoinRow[])
    .filter((j) => j.ingredients)
    .map((j) => ({
      inciName: j.ingredients!.inci_name,
      position: j.position,
      functions: j.ingredients!.functions,
    }));
}

/**
 * Score one product for the signed-in user.
 *
 * Returns null when there's no usable profile — the UI shows a "take the quiz"
 * prompt instead of a meaningless number. Never invent a score for a visitor
 * we know nothing about.
 */
export async function scoreProductForMe(
  productSlug: string,
): Promise<MatchResult | null> {
  const profile = await getMyProfile();
  if (!isScorable(profile)) return null;

  const db = await catalogDb();
  const { data: row } = await db
    .from("products")
    .select("id, canonical_category")
    .eq("slug", productSlug)
    .maybeSingle();
  if (!row) return null;

  const product = row as { id: string; canonical_category: string | null };
  return scoreProduct(profile, {
    id: product.id,
    canonicalCategory: product.canonical_category,
    ingredients: await loadIngredients(product.id),
  });
}

export interface RankedCatalogProduct {
  slug: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  price: string | null;
  result: MatchResult;
}

/**
 * Best products in a category for the signed-in user.
 *
 * `total` is the number of products we actually know about in that category —
 * the UI needs it to stay honest. The catalog is lopsided (231 moisturizers
 * but 2 eye creams), so "top 10" would imply a selection that never happened.
 * Saying "all 7 exfoliants we know about" is the truthful framing.
 */
export async function rankCategoryForMe(
  canonicalCategory: string,
  limit = 10,
): Promise<{ ranked: RankedCatalogProduct[]; total: number; blockedCount: number } | null> {
  const profile = await getMyProfile();
  if (!isScorable(profile)) return null;

  const db = await catalogDb();
  const { data } = await db
    .from("products")
    .select("id, slug, name, brand, image_url, price, canonical_category")
    .eq("canonical_category", canonicalCategory);

  const rows = (data ?? []) as {
    id: string;
    slug: string;
    name: string;
    brand: string;
    image_url: string | null;
    price: string | null;
    canonical_category: string | null;
  }[];
  if (!rows.length) return { ranked: [], total: 0, blockedCount: 0 };

  // One query for every ingredient link in the category, then grouped in
  // memory — a per-product query would be N round trips for 231 moisturizers.
  const { data: joins } = await db
    .from("product_ingredients")
    .select("product_id, position, ingredients(inci_name, functions)")
    .in(
      "product_id",
      rows.map((r) => r.id),
    )
    .order("position");

  const byProduct = new Map<string, ScorableProduct["ingredients"]>();
  for (const j of (joins ?? []) as unknown as (IngredientJoinRow & { product_id: string })[]) {
    if (!j.ingredients) continue;
    const list = byProduct.get(j.product_id) ?? [];
    list.push({
      inciName: j.ingredients.inci_name,
      position: j.position,
      functions: j.ingredients.functions,
    });
    byProduct.set(j.product_id, list);
  }

  const scorable = rows.map((r) => ({
    id: r.id,
    canonicalCategory: r.canonical_category,
    ingredients: byProduct.get(r.id) ?? [],
    meta: r,
  }));

  const { ranked, total, blockedCount } = rankProducts(profile, scorable, { limit });

  return {
    ranked: ranked.map(({ product, result }) => ({
      slug: product.meta.slug,
      name: product.meta.name,
      brand: product.meta.brand,
      imageUrl: product.meta.image_url,
      price: product.meta.price,
      result,
    })),
    total,
    blockedCount,
  };
}
