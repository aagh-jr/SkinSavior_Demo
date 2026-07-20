// Recompute the grade of every claim from its currently-accepted studies.
// Needed after any operation that changes claim→study links outside the
// normal pipeline (e.g. the 20260714000000 badge migration merged duplicate
// claims, so study sets changed under existing grades).
//
// Usage (from repo root):
//   bun --env-file=apps/web/.env.local scripts/regrade-claims.mjs
//
// Idempotent and safe to run any time: grades stay derived-only, written by
// gradeAndWriteClaim exactly as in the rest of the pipeline.

import { createClient } from "@supabase/supabase-js";
import { gradeAndWriteClaim } from "@skinsavior/core/research";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const { data: claims, error } = await db
  .from("claims")
  .select("id, badge_slug, ingredient:ingredients ( normalized_name )")
  .order("badge_slug");
if (error) {
  console.error(error.message);
  process.exit(1);
}

for (const c of claims ?? []) {
  const result = await gradeAndWriteClaim({ db, claimId: c.id });
  console.log(
    `${result.certainty.toUpperCase().padEnd(13)} ${c.ingredient?.normalized_name ?? "?"} — [${c.badge_slug}] [${result.studyCount} studies]`,
  );
}

console.log(`\nDone. regraded=${(claims ?? []).length}`);
process.exit(0);
