// One-time backfill: insert the researched-allowlist ingredients that the
// catalog didn't have yet (the "7 misses" from the pilot survey, plus
// alpha-arbutin). Idempotent: skips any normalized_name that already exists,
// so ingests that raced us are respected.
//
// Usage (from repo root):
//   bun --env-file=apps/web/.env.local scripts/seed-missing-research-ingredients.mjs
//
// Run scripts/seed-ingredient-research.mjs afterwards to warm the PubMed cache
// for the new rows.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

// inci_name is lowercase to match the catalog's existing convention; the
// `functions` tags use the raw token vocabulary that ingredient-filters.ts
// groups into library categories.
const ROWS = [
  { inci_name: "azelaic acid", functions: ["anti-acne", "skin brightening"] },
  { inci_name: "benzoyl peroxide", functions: ["anti-acne", "antimicrobial/antibacterial"] },
  { inci_name: "hydroquinone", functions: ["skin brightening"] },
  { inci_name: "tranexamic acid", functions: ["skin brightening"] },
  { inci_name: "arbutin", functions: ["skin brightening"] },
  { inci_name: "alpha-arbutin", functions: ["skin brightening"] },
  { inci_name: "ferulic acid", functions: ["antioxidant"] },
  {
    inci_name: "copper tripeptide-1",
    common_name: "copper peptides (GHK-Cu)",
    functions: ["cell-communicating ingredient"],
  },
];

let inserted = 0;
let skipped = 0;

for (const row of ROWS) {
  const normalized = row.inci_name.trim().toLowerCase();
  const { data: existing } = await db
    .from("ingredients")
    .select("id")
    .eq("normalized_name", normalized)
    .maybeSingle();
  if (existing) {
    console.log(`SKIP  ${row.inci_name} — already in catalog (${existing.id})`);
    skipped++;
    continue;
  }

  const { data: created, error } = await db
    .from("ingredients")
    .insert(row)
    .select("id")
    .single();
  if (error) {
    console.error(`FAIL  ${row.inci_name} — ${error.message}`);
    continue;
  }
  console.log(`OK    ${row.inci_name} → ${created.id}`);
  inserted++;
}

console.log(`\nDone. inserted=${inserted} skipped=${skipped} / ${ROWS.length}`);
process.exit(0);
