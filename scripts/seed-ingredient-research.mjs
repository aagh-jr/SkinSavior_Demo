// Prefetch PubMed research for the pilot allowlist ingredients and warm the
// cache. Run AFTER applying supabase/migrations/20260708000000_ingredient_research.sql.
//
// Usage (from repo root):
//   node --env-file=apps/web/.env.local scripts/seed-ingredient-research.mjs
//
// Idempotent: re-running refreshes each ingredient's top-5. Respects NCBI rate
// limits by spacing requests ~400ms apart (no API key required).

import { createClient } from "@supabase/supabase-js";
import {
  RESEARCHED_INGREDIENTS,
  getIngredientResearch,
} from "@skinsavior/core/research";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0;
let empty = 0;
let missing = 0;

for (const entry of RESEARCHED_INGREDIENTS) {
  const { data: ing } = await db
    .from("ingredients")
    .select("id, inci_name")
    .eq("normalized_name", entry.normalizedName)
    .maybeSingle();

  if (!ing) {
    console.log(`SKIP  ${entry.label} — no ingredients row (${entry.normalizedName})`);
    missing++;
    continue;
  }

  // now:0 forces a live fetch regardless of any existing freshness window.
  const res = await getIngredientResearch({
    db,
    ingredientId: ing.id,
    inciName: ing.inci_name,
    now: 0,
  });

  const line = `${res.status.toUpperCase().padEnd(5)} ${entry.label} — ${res.papers.length} papers`;
  console.log(line);
  if (res.status === "ok") ok++;
  else if (res.status === "empty") empty++;

  await sleep(400); // NCBI etiquette: stay under 3 req/s
}

console.log(`\nDone. ok=${ok} empty=${empty} missing=${missing} / ${RESEARCHED_INGREDIENTS.length}`);
process.exit(0);
