// Stage-1 extractor: turn cached PubMed abstracts into graded `studies` +
// `claims` (Evidence Explainer spec section 7.1). Claude reads each abstract
// and returns structured fields; plain code validates, writes, and gates.
//
// The human-review gate holds only grade-FLIPPING studies: a study that leaves
// a claim's certainty unchanged is auto-accepted (verified_by='auto:<model>');
// one that would move the grade is left pending (verified_by=null) for
// scripts/review-studies.mjs. Grades are recomputed from accepted studies only.
//
// Usage (from repo root):
//   bun --env-file=apps/web/.env.local scripts/extract-studies.mjs [normalizedName]
// With no arg, processes every allowlisted ingredient that has cached papers.
// Idempotent: studies upsert on (ingredient_id, paper_ref); re-running re-grades.

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { studyExtractionSchema } from "@skinsavior/core/schemas";
import {
  CLAIM_BADGES,
  CLAIM_BADGE_SLUGS,
  RESEARCHED_INGREDIENTS,
  wouldFlipGrade,
  gradeAndWriteClaim,
} from "@skinsavior/core/research";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY (extraction calls Claude).");
  process.exit(1);
}

const MODEL = "claude-opus-4-8";
const VERIFIED_AUTO = `auto:${MODEL}`;
const db = createClient(url, key, { auth: { persistSession: false } });
const claude = new Anthropic();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const onlyName = process.argv[2]?.trim().toLowerCase();
const targets = onlyName
  ? RESEARCHED_INGREDIENTS.filter((i) => i.normalizedName === onlyName)
  : RESEARCHED_INGREDIENTS;
if (!targets.length) {
  console.error(`No allowlisted ingredient matches "${onlyName}".`);
  process.exit(1);
}

/** One line per badge so the model can sort findings into the right bucket. */
const BADGE_LEGEND = CLAIM_BADGE_SLUGS.map(
  (slug) => `- ${slug}: ${CLAIM_BADGES[slug].hint}`,
).join("\n");

const SYSTEM = `You extract structured data from a single PubMed abstract for SkinSavior, an evidence-focused skincare app. You are a careful data-entry assistant, not a reviewer.

Rules:
- Report ONLY what the abstract states. Use null for anything not stated. Never infer, extrapolate, or estimate a number.
- Never conclude that a product "works". You are recording study facts, not efficacy.
- Set design_level from the study design, using the PubMed publication types as a strong hint (meta-analysis/systematic review = 1; randomized controlled trial = 2; cohort/controlled = 3; case series = 4; in vitro / animal / mechanism only = 5).
- conflict_flag is true if industry funding or a conflict of interest is stated or clearly implied.
- File each finding under the badge whose MEANING matches it — the claims field only accepts the slugs below. Findings about a disease or medical condition go under the studied-for-* badges, never a benefit badge.
- Set extraction_confidence to "low" whenever key fields are null or the abstract is ambiguous.
- If the abstract is not a usable study of THIS ingredient's effect on skin, set is_relevant=false and claims=[].

Badge vocabulary:
${BADGE_LEGEND}`;

/** Fields the studies table stores from an extraction. */
const STUDY_COLS = [
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

/** Fields the grading engine reads (StudyInput shape). */
function toStudyInput(row) {
  return {
    design_level: row.design_level,
    sample_size: row.sample_size ?? null,
    conflict_flag: row.conflict_flag ?? false,
    effect_direction: row.effect_direction ?? null,
    concentration: row.concentration ?? null,
    vehicle: row.vehicle ?? null,
    outcome_measured: row.outcome_measured ?? null,
    effect_size: row.effect_size ?? null,
  };
}

/** Accepted StudyInputs for a claim (verified_by set), excluding one study id. */
async function acceptedInputsForClaim(claimId, excludeStudyId) {
  const { data } = await db
    .from("claim_studies")
    .select(
      "study:studies ( id, verified_by, design_level, sample_size, conflict_flag, effect_direction, concentration, vehicle, outcome_measured, effect_size )",
    )
    .eq("claim_id", claimId);
  return (data ?? [])
    .map((r) => r.study)
    .filter((s) => s && s.verified_by != null && s.id !== excludeStudyId)
    .map(toStudyInput);
}

let created = 0;
let accepted = 0;
let pending = 0;
let skipped = 0;
let claimsCreated = 0;

for (const entry of targets) {
  const { data: ing } = await db
    .from("ingredients")
    .select("id, inci_name")
    .eq("normalized_name", entry.normalizedName)
    .maybeSingle();
  if (!ing) {
    console.log(`SKIP  ${entry.label} — no ingredients row`);
    continue;
  }

  const { data: papers } = await db
    .from("research_papers")
    .select("pmid, title, abstract, journal, year, publication_types")
    .eq("ingredient_id", ing.id)
    .order("rank", { ascending: true });
  if (!papers?.length) {
    console.log(`—     ${entry.label} — no cached papers`);
    continue;
  }

  // Papers already stored as human- or seed-authoritative must not be
  // re-extracted — the LLM would clobber curated fields and provenance.
  const { data: existingStudies } = await db
    .from("studies")
    .select("paper_ref, verified_by")
    .eq("ingredient_id", ing.id);
  const authoritative = new Set(
    (existingStudies ?? [])
      .filter((s) => s.verified_by === "seed" || s.verified_by === "human")
      .map((s) => s.paper_ref),
  );

  // Existing claims for this ingredient — a claim is (ingredient, badge), so
  // the same badge from a new paper reuses the same claim row.
  const { data: existingClaims } = await db
    .from("claims")
    .select("id, badge_slug")
    .eq("ingredient_id", ing.id);
  const claimBySlug = new Map((existingClaims ?? []).map((c) => [c.badge_slug, c]));

  console.log(`\n=== ${entry.label} (${papers.length} papers) ===`);

  for (const p of papers) {
    if (authoritative.has(p.pmid)) {
      console.log(`  keep ${p.pmid} — human/seed-verified, not re-extracted`);
      skipped++;
      continue;
    }
    if (!p.abstract) {
      console.log(`  skip ${p.pmid} — no abstract`);
      skipped++;
      continue;
    }

    const userContent = `Ingredient: ${ing.inci_name}
PubMed publication types: ${(p.publication_types ?? []).join(", ") || "n/a"}
Title: ${p.title}
Journal: ${p.journal ?? "n/a"} (${p.year ?? "n/a"})

Abstract:
${p.abstract}`;

    let extraction;
    try {
      const res = await claude.messages.parse({
        model: MODEL,
        max_tokens: 4000,
        system: SYSTEM,
        messages: [{ role: "user", content: userContent }],
        output_config: { format: zodOutputFormat(studyExtractionSchema) },
      });
      if (res.stop_reason === "refusal" || !res.parsed_output) {
        console.log(`  skip ${p.pmid} — refusal/no output`);
        skipped++;
        await sleep(500);
        continue;
      }
      extraction = res.parsed_output;
    } catch (e) {
      console.log(`  FAIL ${p.pmid} — ${e.message}`);
      skipped++;
      await sleep(500);
      continue;
    }

    if (!extraction.is_relevant || !extraction.claims.length) {
      console.log(`  skip ${p.pmid} — not relevant`);
      skipped++;
      await sleep(500);
      continue;
    }

    // Upsert the study row (pending until the gate decides).
    const studyRow = { ingredient_id: ing.id, paper_ref: p.pmid, title: p.title, verified_by: null };
    for (const col of STUDY_COLS) studyRow[col] = extraction[col] ?? null;

    const { data: studyIns, error: studyErr } = await db
      .from("studies")
      .upsert(studyRow, { onConflict: "ingredient_id,paper_ref" })
      .select("id")
      .single();
    if (studyErr) {
      console.log(`  FAIL ${p.pmid} — study upsert: ${studyErr.message}`);
      skipped++;
      continue;
    }
    const studyId = studyIns.id;
    created++;

    // Resolve/create each claim, link, and run the flip gate.
    const affectedClaimIds = new Set();
    let flips = false;
    const studyInput = toStudyInput(studyRow);

    for (const slug of new Set(extraction.claims)) {
      let claim = claimBySlug.get(slug);
      if (!claim) {
        const { data: newClaim, error: claimErr } = await db
          .from("claims")
          .upsert(
            { ingredient_id: ing.id, badge_slug: slug, claim_type: CLAIM_BADGES[slug].type },
            { onConflict: "ingredient_id,badge_slug" },
          )
          .select("id, badge_slug")
          .single();
        if (claimErr) {
          console.log(`  warn  claim "${slug}": ${claimErr.message}`);
          continue;
        }
        claim = newClaim;
        claimBySlug.set(slug, claim);
        claimsCreated++;
      }

      await db
        .from("claim_studies")
        .upsert(
          { claim_id: claim.id, study_id: studyId },
          { onConflict: "claim_id,study_id", ignoreDuplicates: true },
        );
      affectedClaimIds.add(claim.id);

      // Gate against this claim's currently-accepted studies (excluding self).
      const acceptedInputs = await acceptedInputsForClaim(claim.id, studyId);
      if (wouldFlipGrade(acceptedInputs, studyInput)) flips = true;
    }

    // Non-flippers auto-accept and count immediately; flippers wait for review.
    if (!flips) {
      await db.from("studies").update({ verified_by: VERIFIED_AUTO }).eq("id", studyId);
      accepted++;
    } else {
      pending++;
    }

    // Recompute affected claims (accepted-only).
    for (const claimId of affectedClaimIds) {
      try {
        await gradeAndWriteClaim({ db, claimId });
      } catch (e) {
        console.log(`  warn  regrade ${claimId}: ${e.message}`);
      }
    }

    console.log(
      `  ${flips ? "HOLD" : "auto"} ${p.pmid} — L${extraction.design_level}, ${extraction.claims.length} claim(s)${flips ? " (grade-flipping → pending review)" : ""}`,
    );
    await sleep(500); // rate + cost etiquette
  }
}

console.log(
  `\nDone. studies=${created} (auto-accepted=${accepted}, pending=${pending}), new claims=${claimsCreated}, skipped=${skipped}`,
);
process.exit(0);
