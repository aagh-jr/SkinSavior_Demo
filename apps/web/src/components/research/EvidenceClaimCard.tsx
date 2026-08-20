"use client";

import { ArrowUp, ArrowDown, Minus, Lock } from "lucide-react";
import type { GradeReason } from "@skinsavior/core/research";
import type { EvidenceClaim } from "@/lib/claims-db";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ClaimBadgeIcon } from "./ClaimBadgeIcon";
import { EvidenceMeter } from "./EvidenceMeter";

/** Icon + colour for a reason's direction. */
function ReasonIcon({ direction }: { direction: GradeReason["direction"] }) {
  const cls = "mt-0.5 h-3.5 w-3.5 shrink-0";
  switch (direction) {
    case "up":
      return <ArrowUp className={`${cls} text-sage`} aria-hidden="true" />;
    case "down":
      return <ArrowDown className={`${cls} text-clay`} aria-hidden="true" />;
    case "floor":
      return <Lock className={`${cls} text-muted-foreground`} aria-hidden="true" />;
    default:
      return <Minus className={`${cls} text-muted-foreground`} aria-hidden="true" />;
  }
}

/**
 * One graded claim, three layers of disclosure (spec section 9):
 *   Glance   — claim + strength meter, always visible, no jargon.
 *   Why      — the grading reason bullets, expandable.
 *   Receipts — the source studies, strongest design first, wearing their
 *              design-tier tag. The only place study-design vocabulary appears.
 * Everything is framed as statements about the evidence, never the product.
 *
 * `showIngredient` names the active the claim belongs to — used on product
 * pages, where claims from several ingredients share one list.
 */
export function EvidenceClaimCard({
  claim,
  showIngredient = false,
}: {
  claim: EvidenceClaim;
  showIngredient?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      {/* Glance */}
      <div className="mb-2 flex items-center gap-2">
        <Badge
          variant="outline"
          className="flex w-fit items-center gap-1 border-soft-tan text-[11px] font-medium text-muted-foreground"
        >
          <ClaimBadgeIcon slug={claim.badgeSlug} className="h-4 w-4 shrink-0" />
          {claim.badgeLabel}
        </Badge>
        {showIngredient && claim.ingredientName && (
          <span className="text-[11px] font-medium capitalize text-muted-foreground">
            {claim.ingredientName}
          </span>
        )}
      </div>
      <h3 className="font-serif text-lg leading-snug text-ink">{claim.claimText}</h3>
      <EvidenceMeter
        certainty={claim.certainty}
        notches={claim.notches}
        label={claim.label}
        className="mt-3"
      />

      <Accordion type="multiple" className="mt-2">
        {/* Why */}
        {claim.reasons.length > 0 && (
          <AccordionItem value="why" className="border-border">
            <AccordionTrigger className="text-[13px] font-semibold text-muted-foreground hover:no-underline hover:text-ink">
              Why this rating
            </AccordionTrigger>
            <AccordionContent>
              {claim.explainer && (
                <p className="mb-3 text-sm leading-relaxed text-foreground">
                  {claim.explainer}
                </p>
              )}
              <ul className="flex flex-col gap-2.5">
                {claim.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground">
                    <ReasonIcon direction={r.direction} />
                    <span>{r.text}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Receipts */}
        {claim.studies.length > 0 && (
          <AccordionItem value="receipts" className="border-0">
            <AccordionTrigger className="text-[13px] font-semibold text-muted-foreground hover:no-underline hover:text-ink">
              Source studies ({claim.studies.length})
            </AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-3">
                {claim.studies.map((s) => (
                  <li key={s.paperRef} className="flex flex-col gap-1">
                    <Badge
                      variant="outline"
                      className="w-fit border-soft-tan text-[11px] font-medium text-muted-foreground"
                    >
                      {s.tierLabel}
                    </Badge>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm leading-snug text-foreground hover:text-primary hover:underline"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </article>
  );
}
