// Server-only access to the ingredients catalog in Supabase.
//
// Powers the ingredients library page: a paginated, filterable list over the
// ~2.3k ingredient rows. Only ~900 rows carry `functions` data, so a category
// filter naturally narrows to the rows that have been tagged.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  INGREDIENTS_PAGE_SIZE,
  tokensForFilter,
} from "@/lib/ingredient-filters";

const db = supabaseAdmin as unknown as SupabaseClient;

export interface IngredientRow {
  id: string;
  inci_name: string;
  common_name: string | null;
  functions: string[] | null;
  description: string | null;
  safety_notes: string | null;
}

export interface IngredientPage {
  rows: IngredientRow[];
  total: number;
  hasMore: boolean;
}

export interface ListIngredientsParams {
  filter?: string | null;
  q?: string;
  offset?: number;
  limit?: number;
}

/** Fetch a single ingredient by id for its profile page. */
export async function getIngredient(id: string): Promise<IngredientRow | null> {
  const { data, error } = await db
    .from("ingredients")
    .select("id, inci_name, common_name, functions, description, safety_notes")
    .eq("id", id)
    .maybeSingle<IngredientRow>();
  if (error) return null;
  return data ?? null;
}

/**
 * One page of ingredients, ordered by name, optionally filtered by category
 * and/or a free-text name search. `total` is the count matching the filter (so
 * the client can tell when it has loaded everything).
 */
export async function listIngredients({
  filter = null,
  q = "",
  offset = 0,
  limit = INGREDIENTS_PAGE_SIZE,
}: ListIngredientsParams): Promise<IngredientPage> {
  let query = db
    .from("ingredients")
    .select("id, inci_name, common_name, functions, description, safety_notes", {
      count: "exact",
    })
    .order("inci_name", { ascending: true });

  const needle = q.trim();
  if (needle) {
    const safe = needle.replace(/[%,()]/g, " ");
    query = query.or(`inci_name.ilike.%${safe}%,common_name.ilike.%${safe}%`);
  }

  const tokens = tokensForFilter(filter);
  if (tokens) {
    query = query.overlaps("functions", tokens);
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    return { rows: [], total: 0, hasMore: false };
  }

  const rows = (data ?? []) as IngredientRow[];
  const total = count ?? rows.length;
  return { rows, total, hasMore: offset + rows.length < total };
}
