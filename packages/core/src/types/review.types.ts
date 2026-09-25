/**
 * Shared domain types for the study-review queue (/review).
 *
 * Data shapes read by apps/web/src/lib/review-db.ts and rendered by the review
 * components. Kept here so visual components depend on the shared contract
 * rather than on the database module.
 */

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
