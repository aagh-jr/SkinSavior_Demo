import { gradeClaim, type StudyInput } from "./grading";

/**
 * The human-review gate for Stage-1 extraction (spec section 7.1).
 *
 * An LLM-extracted study should not silently change a displayed grade. But the
 * spec only requires human sign-off for studies that would *flip* the grade — a
 * study that leaves the claim's certainty unchanged is safe to auto-accept.
 *
 * `wouldFlipGrade` compares the claim's certainty over its currently-accepted
 * studies against the certainty with the candidate added. Pure and
 * deterministic (it just calls the grading engine twice), so the extractor can
 * decide accept-vs-hold without any I/O.
 */
export function wouldFlipGrade(
  accepted: StudyInput[],
  candidate: StudyInput,
): boolean {
  const before = gradeClaim(accepted).certainty;
  const after = gradeClaim([...accepted, candidate]).certainty;
  return before !== after;
}
