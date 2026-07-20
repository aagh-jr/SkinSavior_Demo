// Server-only data layer for the study-review queue (/review) — the web
// replacement for scripts/review-studies.mjs. The extractor holds any study
// that would move a claim's grade with verified_by=null; a person approves or
// rejects it here before it counts (Evidence Explainer spec section 7.1).
//
// Service-role client, untyped cast, hand-declared rows — same pattern and
// reasons as claims-db.ts. Approve/reject re-grade affected claims through
// gradeAndWriteClaim, the only writer of grade columns.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CERTAINTY_META,
  CLAIM_BADGES,
  DESIGN_TIER_LABELS,
  gradeClaim,
  gradeAndWriteClaim,
  type Certainty,
  type ClaimBadgeSlug,
  type DesignLevel,
  type StudyInput,
} from "@skinsavior/core/research";
import { supabaseAdmin } from "@/lib/supabase/admin";

const db = supabaseAdmin as unknown as SupabaseClient;

const STUDY_INPUT_FIELDS =
  "id, verified_by, design_level, sample_size, conflict_flag, effect_direction, concentration, vehicle, outcome_measured, effect_size";

interface StudyInputRow extends StudyInput {
  id: string;
  verified_by: string | null;
}

function toInput(s: StudyInputRow): StudyInput {
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

export interface ClaimImpact {
  claimId: string;
  badgeSlug: string;
  badgeLabel: string;
  /** Grade from accepted studies today (null = ungraded). */
  currentLabel: string;
  /** Grade if this study is approved. */
  wouldBecomeLabel: string;
  flips: boolean;
}

export interface PendingStudy {
  id: string;
  paperRef: string;
  title: string;
  ingredientName: string;
  tierLabel: string;
  sampleSize: number | null;
  effectDirection: string | null;
  concentration: string | null;
  outcomeMeasured: string | null;
  fundingSource: string | null;
  conflictFlag: boolean;
  extractionConfidence: string | null;
  ingestedAt: string;
  impacts: ClaimImpact[];
}

interface PendingRow {
  id: string;
  paper_ref: string;
  title: string;
  design_level: DesignLevel;
  sample_size: number | null;
  effect_direction: string | null;
  concentration: string | null;
  outcome_measured: string | null;
  funding_source: string | null;
  conflict_flag: boolean;
  extraction_confidence: string | null;
  ingested_at: string;
  ingredient: { inci_name: string; common_name: string | null } | null;
}

const gradeLabel = (c: Certainty | null): string =>
  c ? CERTAINTY_META[c].label : "Not graded yet";

/** Claims this study is linked to, each with its current vs would-be grade. */
async function impactsForStudy(studyId: string, self: StudyInputRow): Promise<ClaimImpact[]> {
  const { data: links, error } = await db
    .from("claim_studies")
    .select("claim_id, claim:claims ( id, badge_slug, certainty )")
    .eq("study_id", studyId);
  if (error) throw error;

  const impacts: ClaimImpact[] = [];
  for (const row of (links ?? []) as unknown as Array<{
    claim_id: string;
    claim: { id: string; badge_slug: string; certainty: Certainty | null } | null;
  }>) {
    if (!row.claim) continue;

    const { data: claimLinks, error: linkErr } = await db
      .from("claim_studies")
      .select(`study:studies ( ${STUDY_INPUT_FIELDS} )`)
      .eq("claim_id", row.claim_id);
    if (linkErr) throw linkErr;

    const acceptedInputs = ((claimLinks ?? []) as unknown as Array<{ study: StudyInputRow | null }>)
      .map((r) => r.study)
      .filter((s): s is StudyInputRow => s != null && s.verified_by != null && s.id !== studyId)
      .map(toInput);

    const wouldBecome = gradeClaim([...acceptedInputs, toInput(self)]).certainty;
    const badge = CLAIM_BADGES[row.claim.badge_slug as ClaimBadgeSlug];
    impacts.push({
      claimId: row.claim.id,
      badgeSlug: row.claim.badge_slug,
      badgeLabel: badge?.label ?? row.claim.badge_slug,
      currentLabel: gradeLabel(row.claim.certainty),
      wouldBecomeLabel: gradeLabel(wouldBecome),
      flips: row.claim.certainty !== wouldBecome,
    });
  }
  return impacts;
}

/** All studies awaiting review (verified_by is null), oldest first. */
export async function listPendingStudies(): Promise<PendingStudy[]> {
  const { data, error } = await db
    .from("studies")
    .select(
      "id, paper_ref, title, design_level, sample_size, effect_direction, concentration, " +
        "outcome_measured, funding_source, conflict_flag, extraction_confidence, ingested_at, " +
        "ingredient:ingredients ( inci_name, common_name )",
    )
    .is("verified_by", null)
    .order("ingested_at", { ascending: true });
  if (error) throw error;

  const out: PendingStudy[] = [];
  for (const row of (data ?? []) as unknown as PendingRow[]) {
    const { data: full, error: fullErr } = await db
      .from("studies")
      .select(STUDY_INPUT_FIELDS)
      .eq("id", row.id)
      .single();
    if (fullErr) throw fullErr;

    out.push({
      id: row.id,
      paperRef: row.paper_ref,
      title: row.title,
      ingredientName: row.ingredient?.common_name?.trim() || row.ingredient?.inci_name || "?",
      tierLabel: DESIGN_TIER_LABELS[row.design_level] ?? "Study",
      sampleSize: row.sample_size,
      effectDirection: row.effect_direction,
      concentration: row.concentration,
      outcomeMeasured: row.outcome_measured,
      fundingSource: row.funding_source,
      conflictFlag: row.conflict_flag,
      extractionConfidence: row.extraction_confidence,
      ingestedAt: row.ingested_at,
      impacts: await impactsForStudy(row.id, full as unknown as StudyInputRow),
    });
  }
  return out;
}

async function regradeClaimsOf(studyId: string): Promise<void> {
  const { data, error } = await db
    .from("claim_studies")
    .select("claim_id")
    .eq("study_id", studyId);
  if (error) throw error;
  for (const row of data ?? []) {
    await gradeAndWriteClaim({ db, claimId: row.claim_id });
  }
}

/** Accept: the study starts counting toward its claims' grades. */
export async function approveStudy(studyId: string): Promise<void> {
  const { error } = await db
    .from("studies")
    .update({ verified_by: "human" })
    .eq("id", studyId);
  if (error) throw error;
  await regradeClaimsOf(studyId);
}

/** Reject: remove the study and its links, then re-grade what it touched. */
export async function rejectStudy(studyId: string): Promise<void> {
  const { data: links, error: linkErr } = await db
    .from("claim_studies")
    .select("claim_id")
    .eq("study_id", studyId);
  if (linkErr) throw linkErr;
  const claimIds = (links ?? []).map((r: { claim_id: string }) => r.claim_id);

  const { error: unlinkErr } = await db.from("claim_studies").delete().eq("study_id", studyId);
  if (unlinkErr) throw unlinkErr;
  const { error: delErr } = await db.from("studies").delete().eq("id", studyId);
  if (delErr) throw delErr;

  for (const claimId of claimIds) await gradeAndWriteClaim({ db, claimId });
}
