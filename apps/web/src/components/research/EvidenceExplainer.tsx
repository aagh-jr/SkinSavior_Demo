import { CERTAINTY_META, type Certainty } from "@skinsavior/core/research";
import type { EvidenceClaim } from "@/lib/claims-db";
import { EvidenceClaimCard } from "./EvidenceClaimCard";

/**
 * Renders the graded claims for a surface (ingredient or product), strongest
 * first, with the standing educational disclaimer the claims policy requires.
 *
 * Short lists stay flat. Past COLLAPSE_THRESHOLD claims the list groups by
 * certainty tier: the strongest tier stays open, weaker tiers collapse behind
 * native <details> — so a long list leads with its best-supported claims
 * without hiding that the thin ones exist. Server component throughout (the
 * disclosure is browser-native; the cards are the only client boundary).
 *
 * `showIngredient` labels each card with its active — for product pages,
 * where several ingredients' claims share one list.
 */

const COLLAPSE_THRESHOLD = 4;

const TIERS_STRONGEST_FIRST = (Object.keys(CERTAINTY_META) as Certainty[]).sort(
  (a, b) => CERTAINTY_META[b].rank - CERTAINTY_META[a].rank,
);

function Disclaimer() {
  return (
    <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
      These ratings describe how much scientific evidence exists — not whether a
      product will work for you. Educational only, not medical advice; check with
      a professional for skin concerns.
    </p>
  );
}

export function EvidenceExplainer({
  claims,
  showIngredient = false,
}: {
  claims: EvidenceClaim[];
  showIngredient?: boolean;
}) {
  if (!claims.length) return null;

  if (claims.length <= COLLAPSE_THRESHOLD) {
    return (
      <div>
        <div className="grid gap-4">
          {claims.map((claim) => (
            <EvidenceClaimCard key={claim.id} claim={claim} showIngredient={showIngredient} />
          ))}
        </div>
        <Disclaimer />
      </div>
    );
  }

  const tiers = TIERS_STRONGEST_FIRST.map((tier) => ({
    tier,
    label: CERTAINTY_META[tier].label,
    claims: claims.filter((c) => c.certainty === tier),
  })).filter((t) => t.claims.length > 0);

  return (
    <div>
      <div className="flex flex-col gap-3">
        {tiers.map(({ tier, label, claims: tierClaims }, i) => (
          <details
            key={tier}
            open={i === 0}
            className="group rounded-2xl border border-border bg-muted/40"
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[13px] font-semibold text-muted-foreground [&::-webkit-details-marker]:hidden">
              <span className="text-ink">{label}</span>
              <span>
                — {tierClaims.length} claim{tierClaims.length === 1 ? "" : "s"}
              </span>
              <span
                aria-hidden="true"
                className="ml-auto text-[11px] transition-transform group-open:rotate-90"
              >
                ▸
              </span>
            </summary>
            <div className="grid gap-4 p-3 pt-0">
              {tierClaims.map((claim) => (
                <EvidenceClaimCard
                  key={claim.id}
                  claim={claim}
                  showIngredient={showIngredient}
                />
              ))}
            </div>
          </details>
        ))}
      </div>
      <Disclaimer />
    </div>
  );
}
