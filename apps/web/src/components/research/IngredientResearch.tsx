"use client";

import type { Paper } from "@skinsavior/core/research";
import { ScientistAvatar } from "@/components/ScientistAvatar";
import { useIngredientResearch } from "@/hooks/useIngredientResearch";

// Study-type badge: PubMed lists several PublicationTypes per paper; show the
// single most significant one. Higher = stronger evidence.
const STUDY_TYPE_RANK: Record<string, number> = {
  "Meta-Analysis": 100,
  "Systematic Review": 90,
  "Randomized Controlled Trial": 80,
  "Controlled Clinical Trial": 70,
  "Clinical Trial": 60,
  "Comparative Study": 40,
  Review: 30,
  "Journal Article": 10,
};

function bestStudyType(types: string[]): string | null {
  if (!types.length) return null;
  let best = types[0];
  let bestScore = STUDY_TYPE_RANK[best] ?? 20;
  for (const t of types) {
    const score = STUDY_TYPE_RANK[t] ?? 20;
    if (score > bestScore) {
      best = t;
      bestScore = score;
    }
  }
  return best;
}

/** Terracotta for the strong study types, muted for the generic ones. */
function badgeTone(type: string): string {
  const score = STUDY_TYPE_RANK[type] ?? 20;
  return score >= 60 ? "bg-primary/10 text-link" : "bg-muted text-muted-foreground";
}

function truncateAbstract(abstract: string, max = 240): string {
  if (abstract.length <= max) return abstract;
  const cut = abstract.slice(0, max);
  const lastStop = cut.lastIndexOf(". ");
  // Prefer a sentence boundary if there's a reasonable one; else hard-cut.
  return (lastStop > 120 ? cut.slice(0, lastStop + 1) : cut.trimEnd()) + "…";
}

function PaperCard({ paper }: { paper: Paper }) {
  const href = paper.doi ? `https://doi.org/${paper.doi}` : paper.pubmed_url;
  const studyType = bestStudyType(paper.publication_types);

  return (
    <details className="group bg-white open:bg-[#fafbfc]">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-[18px] outline-none hover:bg-cream focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            {studyType ? (
              <span
                className={`rounded px-2 py-1 text-[11px] font-semibold ${badgeTone(studyType)}`}
              >
                {studyType}
              </span>
            ) : null}
            {paper.journal ? (
              <span className="text-[12px] text-faint">
                {paper.journal}
                {paper.year ? ` · ${paper.year}` : ""}
              </span>
            ) : null}
          </span>
          <span className="mt-2 block font-serif text-[18px] font-medium leading-snug text-ink">
            {paper.title}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-soft-tan text-lg text-link transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>

      <div className="border-t border-soft-tan px-5 pb-5 pt-4">
        {paper.abstract ? (
          <p className="m-0 max-w-[78ch] text-[13px] leading-[1.6] text-faint">
            {truncateAbstract(paper.abstract)}
          </p>
        ) : (
          <p className="m-0 text-[13px] text-faint">No abstract is available in the catalogue.</p>
        )}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-sm text-[13px] font-semibold text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {paper.doi ? "Read full text →" : "View on PubMed →"}
        </a>
      </div>
    </details>
  );
}

function SkeletonCard() {
  return (
    <div className="border-b border-border bg-card p-5 last:border-b-0">
      <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
      <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted" />
      <div className="mt-1.5 h-4 w-5/6 animate-pulse rounded bg-muted" />
    </div>
  );
}

/** Pure paper list used for cached API results and the static design fixture. */
export function ResearchPaperList({ papers }: { papers: Paper[] }) {
  if (!papers.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-warm-white px-5 py-6 text-sm text-muted-foreground">
        No research found for this ingredient yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-soft-tan overflow-hidden rounded-xl border border-soft-tan">
      {papers.map((paper) => (
        <PaperCard key={paper.pmid} paper={paper} />
      ))}
    </div>
  );
}

/**
 * Shared research card list. Fetches the top-5 cached PubMed papers for an
 * ingredient and renders them. Loading shows the scientist "reading studies";
 * empty and error states are handled inline. Parents gate on the researched
 * allowlist so this only mounts for ingredients expected to have papers.
 */
export function IngredientResearch({ ingredientId }: { ingredientId: string }) {
  const { data, isLoading, isError } = useIngredientResearch(ingredientId);

  if (isLoading) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
          <ScientistAvatar talking size={40} />
          <span>Pulling up the research…</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-soft-tan">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const papers = data?.papers ?? [];

  if (isError || data?.status === "error") {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-warm-white px-5 py-6 text-sm text-muted-foreground">
        Couldn&apos;t load research right now. Please try again later.
      </p>
    );
  }

  return <ResearchPaperList papers={papers} />;
}
