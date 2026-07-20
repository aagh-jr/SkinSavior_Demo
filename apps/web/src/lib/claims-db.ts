// Server-only access to graded Evidence Explainer claims (Pass 2 read layer).
//
// Reads the deterministic grades written by the grading service (studies /
// claims / claim_studies, live since the 20260711000000 migration). The tables
// are public-read, but this module uses the service-role client to match the
// rest of the *-db.ts modules. Row types are hand-declared and the client is
// cast untyped because packages/core/src/supabase/types.ts is stale (same
// pattern as products-db.ts).

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CERTAINTY_META,
  CLAIM_BADGES,
  DESIGN_TIER_LABELS,
  type Certainty,
  type ClaimBadgeSlug,
  type DesignLevel,
  type GradeReason,
} from "@skinsavior/core/research";
import { supabaseAdmin } from "@/lib/supabase/admin";

const db = supabaseAdmin as unknown as SupabaseClient;

export interface EvidenceStudy {
  paperRef: string;
  title: string;
  designLevel: DesignLevel;
  /** Consumer-safe study-type tag (the only place CEBM vocabulary appears). */
  tierLabel: string;
  /** Outbound link to the source paper. */
  href: string;
}

export interface EvidenceClaim {
  id: string;
  ingredientId: string;
  /** Display name of the ingredient (common name, else INCI). */
  ingredientName: string;
  badgeSlug: ClaimBadgeSlug;
  /** Short chip label from the badge catalog, e.g. "Evens tone". */
  badgeLabel: string;
  /** Card headline, resolved from the badge catalog — never stored free text. */
  claimText: string;
  claimType: string;
  certainty: Certainty;
  label: string;
  notches: 1 | 2 | 3 | 4;
  reasons: GradeReason[];
  studyCount: number;
  studies: EvidenceStudy[];
  /**
   * Stage-3 LLM prose — the newest claim_explainers row that PASSED the
   * disallowed-phrase filter and postdates the grade. Null until generated
   * (cards fall back to the deterministic reason bullets alone).
   */
  explainer: string | null;
}

interface StudyRow {
  paper_ref: string;
  title: string;
  design_level: DesignLevel;
}

interface ExplainerRow {
  text: string;
  filter_ok: boolean;
  created_at: string;
}

interface ClaimRow {
  id: string;
  ingredient_id: string;
  badge_slug: string;
  certainty: Certainty | null;
  certainty_reasons: GradeReason[] | null;
  study_count: number;
  computed_at: string | null;
  ingredient: { inci_name: string; common_name: string | null } | null;
  claim_studies: Array<{ study: StudyRow | null }>;
  claim_explainers: ExplainerRow[] | null;
}

const CLAIM_SELECT =
  "id, ingredient_id, badge_slug, certainty, certainty_reasons, study_count, computed_at, " +
  "ingredient:ingredients ( inci_name, common_name ), " +
  "claim_studies ( study:studies ( paper_ref, title, design_level ) ), " +
  "claim_explainers ( text, filter_ok, created_at )";

/** Newest filter-passing prose that is fresher than the grade, else null. */
function freshExplainer(row: ClaimRow): string | null {
  const gradedAt = row.computed_at ? Date.parse(row.computed_at) : 0;
  const fresh = (row.claim_explainers ?? [])
    .filter((e) => e.filter_ok && Date.parse(e.created_at) > gradedAt)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return fresh[0]?.text ?? null;
}

/** PMIDs are all digits; anything else is treated as a DOI. */
function sourceHref(paperRef: string): string {
  const pmid = paperRef.match(/^\d+/)?.[0];
  return pmid && /^\d+$/.test(paperRef)
    ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
    : `https://doi.org/${paperRef}`;
}

function toStudy(row: StudyRow): EvidenceStudy {
  return {
    paperRef: row.paper_ref,
    title: row.title,
    designLevel: row.design_level,
    tierLabel: DESIGN_TIER_LABELS[row.design_level] ?? "Study",
    href: sourceHref(row.paper_ref),
  };
}

function toClaim(row: ClaimRow): EvidenceClaim | null {
  // Defensive: only surface graded claims with a known, renderable badge.
  if (!row.certainty) return null;
  const badge = CLAIM_BADGES[row.badge_slug as ClaimBadgeSlug];
  if (!badge || badge.type === "prohibited") return null;
  const meta = CERTAINTY_META[row.certainty];
  const studies = (row.claim_studies ?? [])
    .map((cs) => cs.study)
    .filter((s): s is StudyRow => s != null)
    .map(toStudy)
    // Strongest design first (CEBM level 1 is strongest).
    .sort((a, b) => Number(a.designLevel) - Number(b.designLevel));

  const ingredientName =
    row.ingredient?.common_name?.trim() || row.ingredient?.inci_name || "";

  return {
    id: row.id,
    ingredientId: row.ingredient_id,
    ingredientName,
    badgeSlug: row.badge_slug as ClaimBadgeSlug,
    badgeLabel: badge.label,
    claimText: badge.cardText,
    claimType: badge.type,
    certainty: row.certainty,
    label: meta.label,
    notches: meta.notches,
    reasons: row.certainty_reasons ?? [],
    studyCount: row.study_count,
    studies,
    explainer: freshExplainer(row),
  };
}

/** Sort strongest certainty first (spec: lead with the best-supported claim). */
function byStrength(a: EvidenceClaim, b: EvidenceClaim): number {
  return CERTAINTY_META[b.certainty].rank - CERTAINTY_META[a.certainty].rank;
}

/** Graded claims for one ingredient, strongest first. */
export async function listClaimsForIngredient(
  ingredientId: string,
): Promise<EvidenceClaim[]> {
  const { data, error } = await db
    .from("claims")
    .select(CLAIM_SELECT)
    .eq("ingredient_id", ingredientId)
    .not("certainty", "is", null)
    // Never surface disease (prohibited) claims as product claims — they're kept
    // as provenance only (claims-policy.md).
    .neq("claim_type", "prohibited");
  if (error) throw error;
  return ((data ?? []) as unknown as ClaimRow[])
    .map(toClaim)
    .filter((c): c is EvidenceClaim => c != null)
    .sort(byStrength);
}

/** Graded claims for several ingredients at once, grouped by ingredient id. */
export async function listClaimsForIngredients(
  ingredientIds: string[],
): Promise<Map<string, EvidenceClaim[]>> {
  const grouped = new Map<string, EvidenceClaim[]>();
  if (!ingredientIds.length) return grouped;

  const { data, error } = await db
    .from("claims")
    .select(CLAIM_SELECT)
    .in("ingredient_id", ingredientIds)
    .not("certainty", "is", null)
    .neq("claim_type", "prohibited");
  if (error) throw error;

  for (const row of (data ?? []) as unknown as ClaimRow[]) {
    const claim = toClaim(row);
    if (!claim) continue;
    const list = grouped.get(claim.ingredientId) ?? [];
    list.push(claim);
    grouped.set(claim.ingredientId, list);
  }
  for (const list of grouped.values()) list.sort(byStrength);
  return grouped;
}
