// Human-review CLI for grade-flipping extracted studies (Evidence Explainer
// spec section 7.1). The extractor holds any study that would move a claim's
// grade with verified_by=null; a person reviews it here before it counts.
//
// Usage (from repo root):
//   bun --env-file=apps/web/.env.local scripts/review-studies.mjs list
//   bun --env-file=apps/web/.env.local scripts/review-studies.mjs approve <study_id>
//   bun --env-file=apps/web/.env.local scripts/review-studies.mjs reject  <study_id>

import { createClient } from "@supabase/supabase-js";
import {
  gradeClaim,
  gradeAndWriteClaim,
  CERTAINTY_META,
} from "@skinsavior/core/research";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const [cmd, studyId] = process.argv.slice(2);

const STUDY_INPUT_FIELDS =
  "id, verified_by, design_level, sample_size, conflict_flag, effect_direction, concentration, vehicle, outcome_measured, effect_size";

function toInput(s) {
  return {
    design_level: s.design_level,
    sample_size: s.sample_size ?? null,
    conflict_flag: s.conflict_flag ?? false,
    effect_direction: s.effect_direction ?? null,
    concentration: s.concentration ?? null,
    vehicle: s.vehicle ?? null,
    outcome_measured: s.outcome_measured ?? null,
    effect_size: s.effect_size ?? null,
  };
}

/** Claims a study is linked to, each with accepted studies (excluding this one). */
async function claimsForStudy(id) {
  const { data } = await db
    .from("claim_studies")
    .select("claim:claims ( id, badge_slug, certainty ), claim_id")
    .eq("study_id", id);
  const out = [];
  for (const row of data ?? []) {
    if (!row.claim) continue;
    const { data: links } = await db
      .from("claim_studies")
      .select(`study:studies ( ${STUDY_INPUT_FIELDS} )`)
      .eq("claim_id", row.claim_id);
    const acceptedInputs = (links ?? [])
      .map((r) => r.study)
      .filter((s) => s && s.verified_by != null && s.id !== id)
      .map(toInput);
    out.push({ claim: row.claim, acceptedInputs });
  }
  return out;
}

const gradeLabel = (c) => (c ? CERTAINTY_META[c].label : "—");

async function list() {
  const { data: pending } = await db
    .from("studies")
    .select("id, paper_ref, title, ingredient:ingredients ( inci_name )")
    .is("verified_by", null)
    .order("ingested_at", { ascending: true });

  if (!pending?.length) {
    console.log("No studies pending review.");
    return;
  }

  console.log(`${pending.length} study(ies) pending review:\n`);
  for (const s of pending) {
    console.log(`• ${s.id}`);
    console.log(`  ${s.ingredient?.inci_name ?? "?"} — ${s.title}`);
    console.log(`  paper_ref ${s.paper_ref}`);
    for (const { claim, acceptedInputs } of await claimsForStudy(s.id)) {
      const { data: full } = await db
        .from("studies")
        .select(STUDY_INPUT_FIELDS)
        .eq("id", s.id)
        .single();
      const would = gradeClaim([...acceptedInputs, toInput(full)]).certainty;
      console.log(
        `    claim [${claim.badge_slug}]: ${gradeLabel(claim.certainty)} → would become ${gradeLabel(would)}`,
      );
    }
    console.log("");
  }
  console.log("Approve with: review-studies.mjs approve <study_id>");
}

async function regradeClaimsOf(id) {
  const { data } = await db.from("claim_studies").select("claim_id").eq("study_id", id);
  for (const row of data ?? []) {
    await gradeAndWriteClaim({ db, claimId: row.claim_id });
  }
}

async function approve(id) {
  const { error } = await db.from("studies").update({ verified_by: "human" }).eq("id", id);
  if (error) throw error;
  await regradeClaimsOf(id);
  console.log(`Approved ${id}; affected claims re-graded.`);
}

async function reject(id) {
  // Capture claims before deleting the links, so we can re-grade after.
  const { data: links } = await db.from("claim_studies").select("claim_id").eq("study_id", id);
  const claimIds = (links ?? []).map((r) => r.claim_id);
  await db.from("claim_studies").delete().eq("study_id", id);
  await db.from("studies").delete().eq("id", id);
  for (const claimId of claimIds) await gradeAndWriteClaim({ db, claimId });
  console.log(`Rejected ${id}; removed and affected claims re-graded.`);
}

try {
  if (cmd === "list") await list();
  else if (cmd === "approve" && studyId) await approve(studyId);
  else if (cmd === "reject" && studyId) await reject(studyId);
  else {
    console.error("Usage: review-studies.mjs list | approve <id> | reject <id>");
    process.exit(1);
  }
  process.exit(0);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
