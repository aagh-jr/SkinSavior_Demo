import { CERTAINTY_META, type Certainty } from "@skinsavior/core/research";
import type { EvidenceClaim } from "@/lib/claims-db";

/**
 * Compact "Evidence by claim" rollup (Paper design "Product Profile 1",
 * Decoder section) — one row per graded claim: avatar, 4-segment strength
 * bar, a plain-language line, and an expandable study list.
 *
 * This sits ABOVE the existing detailed research section (EvidenceExplainer /
 * EvidenceClaimCard, with its Why/Receipts accordion) rather than replacing
 * it — that component is left untouched. Same underlying claims data, just a
 * glanceable summary before the deep-dive.
 */

const TIER_STYLE: Record<
  Certainty,
  { avatarBg: string; avatarFg: string; bar: string; label: string; pillBg: string; pillFg: string }
> = {
  strong: {
    avatarBg: "bg-sage-bg",
    avatarFg: "text-sage",
    bar: "bg-sage",
    label: "text-sage",
    pillBg: "bg-sage-bg",
    pillFg: "text-sage",
  },
  moderate: {
    avatarBg: "bg-sage-bg",
    avatarFg: "text-sage",
    bar: "bg-sage",
    label: "text-sage",
    pillBg: "bg-sage-bg",
    pillFg: "text-sage",
  },
  limited: {
    avatarBg: "bg-clay-glow",
    avatarFg: "text-faint",
    bar: "bg-clay-strong",
    label: "text-faint",
    pillBg: "bg-clay-glow",
    pillFg: "text-faint",
  },
  very_limited: {
    avatarBg: "bg-cream",
    avatarFg: "text-faint",
    bar: "bg-faint",
    label: "text-faint",
    pillBg: "bg-cream",
    pillFg: "text-faint",
  },
};

function ClaimRow({ claim }: { claim: EvidenceClaim }) {
  const meta = CERTAINTY_META[claim.certainty];
  const style = TIER_STYLE[claim.certainty];
  const letter = claim.badgeLabel.trim().charAt(0).toUpperCase();
  // Prefer the Gemini-generated prose; fall back to the badge's fixed
  // consumer headline (never free text — see claim-badges.ts) so the row
  // never shows nothing while an explainer is pending.
  const description = claim.explainer ?? claim.claimText;

  return (
    <div className="flex flex-col gap-4 rounded-sm border border-soft-tan bg-cream p-5 sm:flex-row sm:items-center">
      <div className="flex w-full flex-shrink-0 flex-col items-center gap-2 sm:w-[160px]">
        <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full ${style.avatarBg}`}>
          <span className={`font-mono text-xl font-semibold ${style.avatarFg}`}>{letter}</span>
        </div>
        <span className="text-center font-mono text-[13px] font-medium leading-tight text-ink">
          {claim.badgeLabel}
        </span>
      </div>

      <div className="flex w-full flex-shrink-0 flex-col items-start gap-2 sm:w-[160px]">
        <div className="flex gap-1" role="img" aria-label={`${meta.label}, ${meta.notches} of 4`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className={`h-2 w-8 flex-shrink-0 rounded-sm ${i < meta.notches ? style.bar : "bg-soft-tan"}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <span className={`text-[13px] font-medium ${style.label}`}>{meta.label}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5">
        <p className="m-0 text-[15px] leading-[1.45] text-ink">{description}</p>
        {claim.studies.length > 0 && (
          <details className="group">
            <summary
              className={`inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[13px] font-medium ${style.pillBg} ${style.pillFg} [&::-webkit-details-marker]:hidden`}
            >
              {claim.studies.length} supporting {claim.studies.length === 1 ? "study" : "studies"}
              <span aria-hidden="true" className="transition-transform group-open:rotate-180">
                ⌄
              </span>
            </summary>
            <ul className="mt-2 flex flex-col gap-1.5 pl-0.5">
              {claim.studies.map((s) => (
                <li key={s.paperRef} className="list-none text-[13px] leading-snug">
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:underline"
                  >
                    {s.title}
                  </a>
                  <span className="text-faint"> · {s.tierLabel}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

export function EvidenceByClaim({ claims }: { claims: EvidenceClaim[] }) {
  if (!claims.length) return null;
  return (
    <div className="flex flex-col gap-4">
      {claims.map((claim) => (
        <ClaimRow key={claim.id} claim={claim} />
      ))}
    </div>
  );
}
