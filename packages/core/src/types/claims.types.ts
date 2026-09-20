/**
 * Shared domain types for the Evidence Explainer (graded claims).
 *
 * Data shapes read by apps/web/src/lib/claims-db.ts and rendered by the
 * evidence components. Kept here so visual components depend on the shared
 * contract rather than on the database module.
 */

import type { Certainty, DesignLevel, GradeReason } from "../research/grading";
import type { ClaimBadgeSlug } from "../research/claim-badges";

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
