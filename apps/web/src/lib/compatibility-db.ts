// Bridges the pure routine-compatibility engine to Supabase.
//
// Same split as match-db.ts: analyzeRoutine() in @skinsavior/core/scoring is
// pure and testable, this module only fetches. Nothing here decides whether
// something is a clash.
//
// Catalog reads use the ordinary anon-key client — products, ingredients and
// product_ingredients are public-read under RLS, so no elevated privilege is
// needed. The routine itself is read through the same cookie-aware client, so
// RLS enforces that a user only ever analyses their own routine.

import {
  analyzeRoutine,
  type CompatibilityReport,
  type RoutineStepInput,
} from "@skinsavior/core/scoring";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getRoutineSteps } from "@/lib/routines-db";

interface IngredientJoinRow {
  product_id: string;
  position: number;
  ingredients: { inci_name: string } | null;
}

/**
 * Analyse the signed-in user's routine for clashes and misplaced actives.
 *
 * Returns null when the routine has fewer than one product attached — a
 * routine of empty quiz-seeded placeholder slots has nothing to analyse, and
 * "no clashes found" would be a misleading all-clear.
 */
export async function analyzeMyRoutine(
  routineId: string,
): Promise<CompatibilityReport | null> {
  const steps = await getRoutineSteps(routineId);

  // Placeholder slots (product_id null) carry no ingredient list, so they
  // can't participate in the analysis.
  const withProducts = steps.filter((s) => s.productId);
  if (withProducts.length === 0) return null;

  const db = (await createClient()) as unknown as SupabaseClient;

  // Paginated. A routine of 25 products at ~40 ingredients each already
  // exceeds PostgREST's 1000-row cap, and the ingredients that would be lost
  // are the ones at the END of each INCI list — exactly where fragrance,
  // essential oils and preservatives sit. Truncation here would quietly
  // under-report clashes while the report still looked complete.
  const PAGE = 1000;
  const productIds = withProducts.map((s) => s.productId as string);
  const byProduct = new Map<string, string[]>();

  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await db
      .from("product_ingredients")
      .select("product_id, position, ingredients(inci_name)")
      .in("product_id", productIds)
      .order("product_id")
      .order("position")
      .range(offset, offset + PAGE - 1);
    if (error) break;
    const page = (data ?? []) as unknown as IngredientJoinRow[];
    for (const row of page) {
      if (!row.ingredients) continue;
      byProduct.set(row.product_id, [
        ...(byProduct.get(row.product_id) ?? []),
        row.ingredients.inci_name,
      ]);
    }
    if (page.length < PAGE) break;
  }

  const input: RoutineStepInput[] = withProducts.map((s) => ({
    id: s.id,
    label: s.productName,
    timeOfDay: s.timeOfDay,
    ingredients: byProduct.get(s.productId as string) ?? [],
    category: s.category,
  }));

  return analyzeRoutine(input);
}
