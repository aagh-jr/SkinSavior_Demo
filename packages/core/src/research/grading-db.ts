import type { SupabaseClient } from "@supabase/supabase-js";
import { gradeClaim, type GradeResult, type StudyInput } from "./grading";

/**
 * Bridges the pure grading engine (grading.ts) to Supabase.
 *
 * This module is the ONLY writer of a claim's `certainty`, `certainty_reasons`,
 * `study_count` and `computed_at` columns (spec section 5 invariant). Ingestion,
 * the runtime LLM, and humans never touch them — the grade is derived, not set.
 *
 * Dependency-injected `db` (service role) mirrors cache.ts so it's unit-testable
 * with a fake Supabase builder. Row shapes are hand-declared because the
 * generated types in ../supabase/types.ts predate these tables.
 */

interface StudyRow extends StudyInput {
  id: string;
  /** Accept flag — a study counts toward the grade only once this is set. */
  verified_by: string | null;
}

export interface GradeAndWriteResult extends GradeResult {
  claimId: string;
  studyCount: number;
}

const STUDY_FIELDS =
  "id, verified_by, design_level, sample_size, conflict_flag, effect_direction, concentration, vehicle, outcome_measured, effect_size";

/**
 * Load the ACCEPTED studies linked to a claim. A study counts toward the grade
 * only once `verified_by` is set (seed, auto-accepted non-flipper, or human
 * approval). Grade-flipping studies pending review (`verified_by is null`) are
 * stored and linked but excluded here so they never move a displayed grade.
 */
async function loadLinkedStudies(
  db: SupabaseClient,
  claimId: string,
): Promise<StudyRow[]> {
  const { data, error } = await db
    .from("claim_studies")
    .select(`study:studies (${STUDY_FIELDS})`)
    .eq("claim_id", claimId);
  if (error) throw error;
  // Supabase returns the embedded to-one row under the aliased `study` key. The
  // generated types are stale (they predate these tables), so the client infers
  // the embed as an array — bridge through unknown, as products-db.ts does.
  return ((data ?? []) as unknown as Array<{ study: StudyRow | null }>)
    .map((r) => r.study)
    .filter((s): s is StudyRow => s != null && s.verified_by != null);
}

/**
 * Recompute one claim's grade from its currently-linked studies and write the
 * result back onto the claim row. Call whenever a claim's studies change (the
 * seed does this now; the future extractor will call it per claim). Synchronous
 * and on-demand — no cron.
 */
export async function gradeAndWriteClaim({
  db,
  claimId,
  now = Date.now(),
}: {
  db: SupabaseClient;
  claimId: string;
  now?: number;
}): Promise<GradeAndWriteResult> {
  const studies = await loadLinkedStudies(db, claimId);
  const result = gradeClaim(studies);

  const { error } = await db
    .from("claims")
    .update({
      certainty: result.certainty,
      certainty_reasons: result.reasons,
      study_count: studies.length,
      computed_at: new Date(now).toISOString(),
    })
    .eq("id", claimId);
  if (error) throw error;

  return { ...result, claimId, studyCount: studies.length };
}
