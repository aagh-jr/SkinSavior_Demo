// Stage-3 explainer generation: write plain-language evidence prose for each
// graded claim (Evidence Explainer spec section 8, docs/claims-policy.md).
//
// Gemini 2.5 Flash-Lite turns a claim's grade + reasons + accepted studies
// into 2-3 sentences. The prompt and the disallowed-phrase filter live in
// packages/core/src/research/explainer.ts (pure, unit-tested); this script
// only orchestrates. EVERY generation — pass or fail — is inserted into
// claim_explainers, which is the audit log; the read layer renders only
// filter-passing rows fresher than the claim's grade.
//
// Usage (from repo root):
//   bun --env-file=apps/web/.env.local scripts/generate-explainers.mjs [--force]
// Skips claims that already have a fresh passing explainer unless --force.
// Requires GEMINI_API_KEY in the env.

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import {
  CLAIM_BADGES,
  CERTAINTY_META,
  DESIGN_TIER_LABELS,
  EXPLAINER_MODEL,
  buildExplainerPrompt,
  checkExplainerText,
} from "@skinsavior/core/research";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY (explainer generation calls Gemini).");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const ai = new GoogleGenAI({});
const force = process.argv.includes("--force");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generate(system, user) {
  const res = await ai.models.generateContent({
    model: EXPLAINER_MODEL,
    contents: user,
    config: { systemInstruction: system, temperature: 0.3 },
  });
  return (res.text ?? "").trim();
}

/** Accepted studies behind a claim, shaped for the prompt. */
async function studiesForClaim(claimId) {
  const { data } = await db
    .from("claim_studies")
    .select("study:studies ( title, design_level, sample_size, verified_by )")
    .eq("claim_id", claimId);
  return (data ?? [])
    .map((r) => r.study)
    .filter((s) => s && s.verified_by != null)
    .sort((a, b) => Number(a.design_level) - Number(b.design_level))
    .map((s) => ({
      tierLabel: DESIGN_TIER_LABELS[s.design_level] ?? "Study",
      title: s.title,
      sampleSize: s.sample_size ?? null,
    }));
}

const { data: claims, error } = await db
  .from("claims")
  .select("id, badge_slug, claim_type, certainty, certainty_reasons, computed_at")
  .not("certainty", "is", null)
  .neq("claim_type", "prohibited");
if (error) {
  console.error(error.message);
  process.exit(1);
}

let written = 0;
let failed = 0;
let skipped = 0;

for (const claim of claims ?? []) {
  const badge = CLAIM_BADGES[claim.badge_slug];
  if (!badge) {
    console.log(`skip ${claim.id} — unknown badge ${claim.badge_slug}`);
    skipped++;
    continue;
  }

  if (!force) {
    // Fresh passing prose already on file? A regrade bumps computed_at and
    // stales it, so freshness is created_at > computed_at.
    const { data: existing } = await db
      .from("claim_explainers")
      .select("id, created_at")
      .eq("claim_id", claim.id)
      .eq("filter_ok", true)
      .gt("created_at", claim.computed_at)
      .limit(1);
    if (existing?.length) {
      console.log(`ok   [${claim.badge_slug}] — fresh explainer exists`);
      skipped++;
      continue;
    }
  }

  const studies = await studiesForClaim(claim.id);
  if (!studies.length) {
    console.log(`skip [${claim.badge_slug}] — no accepted studies`);
    skipped++;
    continue;
  }

  const input = {
    badgeLabel: badge.label,
    cardText: badge.cardText,
    certaintyLabel: CERTAINTY_META[claim.certainty].label,
    reasons: (claim.certainty_reasons ?? []).map((r) => r.text),
    studies,
  };
  const { system, user } = buildExplainerPrompt(input);

  // One retry with the violations fed back; both attempts are logged.
  let attemptUser = user;
  let ok = false;
  for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
    let text;
    try {
      text = await generate(system, attemptUser);
    } catch (e) {
      console.log(`FAIL [${claim.badge_slug}] — ${e.message}`);
      failed++;
      break;
    }
    if (!text) {
      console.log(`FAIL [${claim.badge_slug}] — empty response`);
      failed++;
      break;
    }

    const check = checkExplainerText(text);
    const { error: insErr } = await db.from("claim_explainers").insert({
      claim_id: claim.id,
      model: EXPLAINER_MODEL,
      text,
      filter_ok: check.ok,
      filter_violations: check.ok ? null : check.violations,
    });
    if (insErr) {
      console.log(`FAIL [${claim.badge_slug}] — insert: ${insErr.message}`);
      failed++;
      break;
    }

    if (check.ok) {
      ok = true;
      written++;
      console.log(`gen  [${claim.badge_slug}] — ${text.slice(0, 70)}…`);
    } else {
      const summary = check.violations.map((v) => `${v.code}:"${v.match}"`).join(", ");
      console.log(`     [${claim.badge_slug}] attempt ${attempt} tripped filter (${summary})`);
      attemptUser = `${user}

Your previous draft was rejected by the compliance filter for: ${summary}.
Rewrite it without those words or framings.`;
      if (attempt === 2) failed++;
    }
  }

  await sleep(300); // rate etiquette
}

console.log(`\nDone. written=${written}, filter-failed=${failed}, skipped=${skipped}`);
process.exit(0);
