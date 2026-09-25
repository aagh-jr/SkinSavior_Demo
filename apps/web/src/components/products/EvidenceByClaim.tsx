import { CERTAINTY_META, type Certainty } from "@skinsavior/core/research";
import type { EvidenceClaim } from "@skinsavior/core/types";

const TIER_STYLE: Record<Certainty, { bar: string; label: string }> = {
  strong: { bar: "bg-sage", label: "text-sage" },
  moderate: { bar: "bg-sage", label: "text-sage" },
  limited: { bar: "bg-clay-strong", label: "text-faint" },
  very_limited: { bar: "bg-faint", label: "text-faint" },
};

function ClaimCard({ claim }: { claim: EvidenceClaim }) {
  const meta = CERTAINTY_META[claim.certainty];
  const style = TIER_STYLE[claim.certainty];
  const letter = claim.badgeLabel.trim().charAt(0).toUpperCase();
  const description = claim.explainer ?? claim.claimText;

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-soft-tan bg-[#fafbfc] p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ink text-white">
          <span className="font-mono text-[13px] font-bold">{letter}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 font-sans text-[15px] font-semibold tracking-normal text-ink">
            {claim.badgeLabel}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <div
              className="flex w-20 shrink-0 items-center gap-1"
              role="img"
              aria-label={`${meta.label}, ${meta.notches} of 4`}
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 min-w-3 flex-1 rounded-full ${
                    index < meta.notches ? style.bar : "bg-soft-tan"
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className={`text-[10px] font-semibold ${style.label}`}>{meta.label}</span>
          </div>
        </div>
      </div>

      <p className="mt-4 flex-1 text-[14px] leading-[1.55] text-faint">{description}</p>

      {claim.studies.length > 0 ? (
        <details className="group mt-4">
          <summary className="cursor-pointer list-none rounded-sm text-[13px] font-semibold text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            {claim.studies.length} supporting {claim.studies.length === 1 ? "study" : "studies"}
            <span
              aria-hidden="true"
              className="ml-1 inline-block transition-transform group-open:rotate-90"
            >
              →
            </span>
          </summary>
          <ul className="mt-3 space-y-2 border-t border-soft-tan pt-3">
            {claim.studies.map((study) => (
              <li key={study.paperRef} className="text-[12px] leading-snug text-faint">
                <a
                  href={study.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:underline"
                >
                  {study.title}
                </a>
                <span> · {study.tierLabel}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </article>
  );
}

/** Three-up claim cards from the shipping product-page frame. */
export function EvidenceByClaim({ claims }: { claims: EvidenceClaim[] }) {
  if (!claims.length) {
    return (
      <article className="rounded-xl border border-soft-tan bg-[#fafbfc] p-6">
        <h3 className="m-0 font-sans text-[15px] font-semibold text-ink">
          No graded claims yet
        </h3>
        <p className="mb-0 mt-3 text-[14px] leading-[1.55] text-faint">
          We do not have vetted claim evidence for this product yet. An ingredient list alone
          cannot establish how well the finished formula works.
        </p>
      </article>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {claims.map((claim) => (
        <ClaimCard key={claim.id} claim={claim} />
      ))}
    </div>
  );
}
