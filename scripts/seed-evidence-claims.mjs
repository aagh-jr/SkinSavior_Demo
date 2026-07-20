// Seed the Evidence Explainer with hand-classified studies + claims, then run
// the deterministic grading engine to compute each claim's certainty.
//
// Run AFTER applying supabase/migrations/20260711000000_evidence_explainer.sql.
//
// Usage (from repo root):
//   bun --env-file=apps/web/.env.local scripts/seed-evidence-claims.mjs
//
// Idempotent: studies upsert on (ingredient_id, paper_ref), claims on
// (ingredient_id, badge_slug), joins on their composite pk. Re-running
// refreshes rows and recomputes grades. Grades are written ONLY by
// gradeAndWriteClaim — never inline here — preserving the certainty invariant.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { CLAIM_BADGES, gradeAndWriteClaim } from "@skinsavior/core/research";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const here = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(join(here, "seed", "evidence-seed.json"), "utf8"));

// Columns the grading engine reads / the studies table stores. `_expected` and
// other underscore-prefixed keys in the JSON are notes, never written.
const STUDY_COLS = [
  "paper_ref",
  "title",
  "design_level",
  "sample_size",
  "duration_weeks",
  "population",
  "concentration",
  "vehicle",
  "outcome_measured",
  "effect_direction",
  "effect_size",
  "funding_source",
  "conflict_flag",
  "extraction_confidence",
];

let graded = 0;
let skipped = 0;

for (const claim of seed.claims) {
  const { data: ing } = await db
    .from("ingredients")
    .select("id, inci_name")
    .eq("normalized_name", claim.ingredient)
    .maybeSingle();

  if (!ing) {
    console.log(`SKIP  ${claim.ingredient} — no ingredients row`);
    skipped++;
    continue;
  }

  // 1. Upsert studies, get their ids back.
  const studyRows = claim.studies.map((s) => {
    // Hand-entered seed studies are accepted by definition — they count toward
    // grades. Extracted studies come in via scripts/extract-studies.mjs.
    const row = { ingredient_id: ing.id, verified_by: "seed" };
    for (const col of STUDY_COLS) row[col] = s[col] ?? null;
    return row;
  });
  const { data: studies, error: studyErr } = await db
    .from("studies")
    .upsert(studyRows, { onConflict: "ingredient_id,paper_ref" })
    .select("id");
  if (studyErr) {
    console.error(`FAIL  studies for "${claim.badge_slug}":`, studyErr.message);
    process.exit(1);
  }

  // 2. Upsert the claim (certainty columns left untouched — grading owns them).
  //    claim_type comes from the badge catalog, never from the seed file.
  const { data: claimRow, error: claimErr } = await db
    .from("claims")
    .upsert(
      {
        ingredient_id: ing.id,
        badge_slug: claim.badge_slug,
        claim_type: CLAIM_BADGES[claim.badge_slug].type,
      },
      { onConflict: "ingredient_id,badge_slug" },
    )
    .select("id")
    .single();
  if (claimErr) {
    console.error(`FAIL  claim "${claim.badge_slug}":`, claimErr.message);
    process.exit(1);
  }

  // 3. Link studies to the claim.
  const links = studies.map((s) => ({ claim_id: claimRow.id, study_id: s.id }));
  const { error: linkErr } = await db
    .from("claim_studies")
    .upsert(links, { onConflict: "claim_id,study_id", ignoreDuplicates: true });
  if (linkErr) {
    console.error(`FAIL  links for "${claim.badge_slug}":`, linkErr.message);
    process.exit(1);
  }

  // 4. Compute + write the grade deterministically.
  const result = await gradeAndWriteClaim({ db, claimId: claimRow.id });
  const expected = claim._expected ? ` (expected ${claim._expected})` : "";
  console.log(
    `${result.certainty.toUpperCase().padEnd(13)} ${claim.ingredient} — [${claim.badge_slug}] [${result.studyCount} studies]${expected}`,
  );
  graded++;
}

console.log(`\nDone. graded=${graded} skipped=${skipped} / ${seed.claims.length}`);
process.exit(0);
