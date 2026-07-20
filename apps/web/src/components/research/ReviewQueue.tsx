"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import type { PendingStudy } from "@/lib/review-db";
import { approveStudyAction, rejectStudyAction } from "@/app/review/actions";
import { Badge } from "@/components/ui/badge";

/** One pending study: extracted fields, per-claim grade impact, approve/reject. */
function ReviewCard({ study }: { study: PendingStudy }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const act = (action: (id: string) => Promise<{ ok: boolean } | { ok: false; error: string }>) => {
    setError(null);
    startTransition(async () => {
      const res = await action(study.id);
      if (!res.ok) setError("error" in res ? res.error : "Something went wrong.");
      else router.refresh();
    });
  };

  const facts: Array<[string, string | null]> = [
    ["Sample", study.sampleSize != null ? `n=${study.sampleSize}` : null],
    ["Effect", study.effectDirection],
    ["Concentration", study.concentration],
    ["Outcome", study.outcomeMeasured],
    ["Funding", study.fundingSource],
    ["Extraction confidence", study.extractionConfidence],
  ];

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="w-fit border-soft-tan text-[11px] font-medium text-muted-foreground"
        >
          {study.tierLabel}
        </Badge>
        <span className="text-[12px] font-medium capitalize text-muted-foreground">
          {study.ingredientName}
        </span>
        {study.conflictFlag && (
          <Badge variant="outline" className="w-fit border-clay text-[11px] text-clay">
            Industry-funded
          </Badge>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">{study.paperRef}</span>
      </div>

      <h3 className="mt-2 font-serif text-lg leading-snug text-ink">{study.title}</h3>

      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
        {facts
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
              <dd className="text-[13px] text-foreground">{v}</dd>
            </div>
          ))}
      </dl>

      {/* What approving does to each linked claim's grade. */}
      <div className="mt-4 flex flex-col gap-1.5 rounded-xl bg-muted/50 p-3">
        {study.impacts.map((impact) => (
          <div key={impact.claimId} className="flex items-center gap-2 text-[13px]">
            <span className="font-semibold text-ink">{impact.badgeLabel}</span>
            <span className="text-muted-foreground">{impact.currentLabel}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className={impact.flips ? "font-semibold text-clay" : "text-muted-foreground"}>
              {impact.wouldBecomeLabel}
            </span>
          </div>
        ))}
        {!study.impacts.length && (
          <span className="text-[13px] text-muted-foreground">Linked to no claims.</span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <button
          onClick={() => act(approveStudyAction)}
          disabled={pending}
          className="rounded-xl bg-sage px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => act(rejectStudyAction)}
          disabled={pending}
          className="rounded-xl border border-clay px-4 py-2 text-sm font-semibold text-clay hover:bg-muted disabled:opacity-50"
        >
          Reject
        </button>
        {pending && <span className="text-[13px] text-muted-foreground">Working…</span>}
        {error && <span className="text-[13px] text-clay">{error}</span>}
      </div>
    </article>
  );
}

export function ReviewQueue({ studies }: { studies: PendingStudy[] }) {
  if (!studies.length) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Nothing pending — every extracted study has been reviewed.
      </p>
    );
  }
  return (
    <div className="grid gap-4">
      {studies.map((s) => (
        <ReviewCard key={s.id} study={s} />
      ))}
    </div>
  );
}
