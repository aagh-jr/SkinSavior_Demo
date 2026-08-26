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
  rankProductsForRoutine,
  scoreProduct,
  type MatchResult,
  type RoutineStepInput,
  type ScorableProduct,
  type SkinProfile,
} from "@skinsavior/core/scoring";
import { getHomeRoutine } from "@/lib/routines-db";
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

export interface ProductMatch {
  score: number;
  blocked: boolean;
}

/**
 * Score many products for the signed-in user in a bounded number of queries.
 *
 * Returns null when there's no scorable profile — the caller hides the badge
 * rather than invent a number for a visitor we know nothing about (same
 * contract as scoreProductForMe). Otherwise a map keyed by slug; a slug whose
 * product has no ingredient data is omitted rather than scored as empty.
 *
 * The INCI join is paginated. product_ingredients for ~50 products easily
 * clears the 1000-row PostgREST cap, and a truncated read drops the TAIL of
 * concentration-ordered lists — precisely where fragrance, oils and
 * preservatives sit. A silently short list would recompute a "clean" score for
 * a product that isn't. See CLAUDE.md, "the failure mode that keeps recurring".
 */
export async function scoreProductsForMe(
  slugs: string[],
): Promise<Record<string, ProductMatch> | null> {
  const profile = await getMyProfile();
  if (!isScorable(profile)) return null;

  const unique = [...new Set(slugs)].filter(Boolean);
  if (unique.length === 0) return {};

  const db = await catalogDb();
  const { data: prodRows } = await db
    .from("products")
    .select("id, slug, canonical_category")
    .in("slug", unique);

  const productList = (prodRows ?? []) as {
    id: string;
    slug: string;
    canonical_category: string | null;
  }[];
  if (productList.length === 0) return {};

  const productIds = productList.map((p) => p.id);

  // Page through the join in 1000-row windows until a short page proves we've
  // read the tail. Never a bare `.select()` here — see the doc comment.
  type JoinRow = IngredientJoinRow & { product_id: string };
  const joinRows: JoinRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("product_ingredients")
      .select("product_id, position, ingredients(inci_name, functions)")
      .in("product_id", productIds)
      .order("product_id")
      .order("position")
      .range(from, from + PAGE - 1);
    if (error) break;
    const batch = (data ?? []) as unknown as JoinRow[];
    joinRows.push(...batch);
    if (batch.length < PAGE) break;
  }

  const byProduct = new Map<
    string,
    { inciName: string; position: number; functions: string[] | null }[]
  >();
  for (const j of joinRows) {
    if (!j.ingredients) continue;
    const list = byProduct.get(j.product_id) ?? [];
    list.push({
      inciName: j.ingredients.inci_name,
      position: j.position,
      functions: j.ingredients.functions,
    });
    byProduct.set(j.product_id, list);
  }

  const out: Record<string, ProductMatch> = {};
  for (const p of productList) {
    const ingredients = byProduct.get(p.id);
    if (!ingredients || ingredients.length === 0) continue;
    const result = scoreProduct(profile, {
      id: p.id,
      canonicalCategory: p.canonical_category,
      ingredients,
    });
    out[p.slug] = { score: result.score, blocked: result.blocked };
  }
  return out;
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
    .eq("canonical_category", canonicalCategory)
    // Out-of-scope products (makeup, accessories, bundles, no ingredients) are
    // flagged rather than deleted — migration 20260816000000. Recommending
    // them would be worse than not having them: a mascara has an INCI list but
    // nothing here can say anything useful about it.
    .is("excluded_reason", null);

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

  // Ingredient links for the whole category, PAGINATED.
  //
  // PostgREST caps a response at 1000 rows. A category is far larger than
  // that — 127 serums at ~40 ingredients each is ~5000 links — so a single
  // request returned only each product's first few ingredients. That failed
  // silently and in the worst direction: a product whose blocking ingredient
  // sits deep in the INCI list (essential oils are typically last) came back
  // looking safe, so safety exclusions were being dropped from the ranking
  // entirely. Anything that reads a whole category has to page.
  const PAGE = 1000;
  const productIds = rows.map((r) => r.id);
  const byProduct = new Map<string, ScorableProduct["ingredients"]>();

  for (let offset = 0; ; offset += PAGE) {
    const { data: joins, error } = await db
      .from("product_ingredients")
      .select("product_id, position, ingredients(inci_name, functions)")
      .in("product_id", productIds)
      .order("product_id")
      .order("position")
      .range(offset, offset + PAGE - 1);

    if (error) break;
    const page = (joins ?? []) as unknown as (IngredientJoinRow & { product_id: string })[];
    for (const j of page) {
      if (!j.ingredients) continue;
      const list = byProduct.get(j.product_id) ?? [];
      list.push({
        inciName: j.ingredients.inci_name,
        position: j.position,
        functions: j.ingredients.functions,
      });
      byProduct.set(j.product_id, list);
    }
    if (page.length < PAGE) break;
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

/**
 * The signed-in user's routine, shaped for the interaction engine.
 *
 * `id` is the PRODUCT id, not the routine-step id. findRoutineConflicts()
 * excludes the candidate from its own routine by id, and keying on the step
 * would defeat that -- a product you already use would be reported as
 * clashing with itself.
 *
 * Steps without a product are quiz-seeded placeholder slots. They carry no
 * ingredients, so they can neither cause nor rule out a clash.
 */
export async function getMyRoutineSteps(): Promise<RoutineStepInput[]> {
  const routine = await getHomeRoutine();
  if (!routine) return [];
  const withProducts = routine.steps.filter((s) => s.productId);
  if (!withProducts.length) return [];

  const db = await catalogDb();
  const PAGE = 1000;
  const productIds = withProducts.map((s) => s.productId as string);
  const byProduct = new Map<string, string[]>();

  // Paginated for the reason documented throughout this file: PostgREST caps
  // a response at 1000 rows, and the ingredients lost to truncation are the
  // ones at the END of each INCI list -- where fragrance, essential oils and
  // preservatives sit. Under-reporting clashes would look identical to having
  // none.
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await db
      .from("product_ingredients")
      .select("product_id, position, ingredients(inci_name, functions)")
      .in("product_id", productIds)
      .order("product_id")
      .order("position")
      .range(offset, offset + PAGE - 1);
    if (error) break;
    const page = (data ?? []) as unknown as (IngredientJoinRow & { product_id: string })[];
    for (const row of page) {
      if (!row.ingredients) continue;
      byProduct.set(row.product_id, [
        ...(byProduct.get(row.product_id) ?? []),
        row.ingredients.inci_name,
      ]);
    }
    if (page.length < PAGE) break;
  }

  return withProducts.map((s) => ({
    id: s.productId as string,
    label: `${s.productBrand} ${s.productName}`.trim(),
    timeOfDay: s.timeOfDay,
    ingredients: byProduct.get(s.productId as string) ?? [],
    category: s.category,
  }));
}

export interface RoutineAwareCatalogProduct extends RankedCatalogProduct {
  conflicts: {
    code: string;
    severity: "minor" | "major";
    title: string;
    explanation: string;
    recommendation: string;
    evidenceTier: string;
    steps: string[];
    ingredients: string[];
  }[];
}

/**
 * rankCategoryForMe(), but each product is also checked against the routine
 * the user already owns.
 *
 * Ordering is identical -- a conflict never moves a product up or down. It is
 * reported alongside the score, the same way `blocked` is, because most
 * routine conflicts are solved by timing rather than by avoidance and burying
 * the product would explain nothing.
 *
 * `routineChecked` is false when there is no routine to check against, so the
 * UI can say "we haven't checked this" instead of implying an all-clear.
 */
export async function rankCategoryWithRoutine(
  canonicalCategory: string,
  limit = 10,
): Promise<{
  ranked: RoutineAwareCatalogProduct[];
  total: number;
  blockedCount: number;
  conflictCount: number;
  routineChecked: boolean;
} | null> {
  const profile = await getMyProfile();
  if (!isScorable(profile)) return null;

  const [base, routine] = await Promise.all([
    rankCategoryForMe(canonicalCategory, limit),
    getMyRoutineSteps(),
  ]);
  if (!base) return null;

  // Re-score only the page being shown. Scoring the whole category against the
  // routine would be wasted work: ordering is unchanged by conflicts, so
  // products below the cut cannot move into it.
  const db = await catalogDb();
  const slugs = base.ranked.map((r) => r.slug);
  if (!slugs.length || !routine.length) {
    return { ...base, ranked: base.ranked.map((r) => ({ ...r, conflicts: [] })),
             conflictCount: 0, routineChecked: routine.length > 0 };
  }

  const { data } = await db
    .from("products")
    .select("id, slug, canonical_category")
    .in("slug", slugs);
  const rows = (data ?? []) as { id: string; slug: string; canonical_category: string | null }[];
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  const scorable: (ScorableProduct & { meta: RankedCatalogProduct })[] = [];
  for (const r of base.ranked) {
    const row = bySlug.get(r.slug);
    if (!row) continue;
    scorable.push({
      id: row.id,
      canonicalCategory: row.canonical_category,
      ingredients: await loadIngredients(row.id),
      meta: r,
    });
  }

  const { ranked, conflictCount } = rankProductsForRoutine(profile, scorable, routine);
  const order = new Map(base.ranked.map((r, i) => [r.slug, i]));

  return {
    ranked: ranked
      .map(({ product, result }) => ({
        ...product.meta,
        conflicts: result.fit.conflicts.map((c) => ({ ...c, evidenceTier: c.evidenceTier as string })),
      }))
      .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0)),
    total: base.total,
    blockedCount: base.blockedCount,
    conflictCount,
    routineChecked: true,
  };
}
