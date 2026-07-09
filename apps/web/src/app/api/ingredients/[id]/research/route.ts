import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getIngredientResearch, isResearched } from "@skinsavior/core/research";
import { supabaseAdmin } from "@/lib/supabase/admin";

// A cache miss fetches PubMed live (esearch + efetch), so allow headroom.
export const maxDuration = 30;

const db = supabaseAdmin as unknown as SupabaseClient;

const paramsSchema = z.object({ id: z.string().uuid() });

/**
 * Ingredient research: returns the top-5 cached PubMed papers for an
 * ingredient. This is the only surface the client calls — it never touches
 * PubMed. Writes (on a cache miss) happen here via the service role.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid ingredient id." }, { status: 400 });
  }
  const ingredientId = parsed.data.id;

  const { data: ingredient } = await db
    .from("ingredients")
    .select("inci_name")
    .eq("id", ingredientId)
    .maybeSingle<{ inci_name: string }>();

  if (!ingredient) {
    return NextResponse.json({ error: "Ingredient not found." }, { status: 404 });
  }

  // Pilot gate: only researched-allowlist ingredients get a result set.
  if (!isResearched(ingredient.inci_name)) {
    return NextResponse.json({ papers: [], status: "empty" });
  }

  const result = await getIngredientResearch({
    db,
    ingredientId,
    inciName: ingredient.inci_name,
  });

  return NextResponse.json({ papers: result.papers, status: result.status });
}
