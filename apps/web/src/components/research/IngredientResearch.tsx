"use client";

import { useQuery } from "@tanstack/react-query";
import type { Paper } from "@skinsavior/core/research";
import { ScientistAvatar } from "@/components/ScientistAvatar";

interface ResearchResponse {
  papers: Paper[];
  status: "ok" | "empty" | "error";
}

async function fetchResearch(ingredientId: string): Promise<ResearchResponse> {
  const res = await fetch(`/api/ingredients/${ingredientId}/research`);
  if (!res.ok) throw new Error(`Research request failed (HTTP ${res.status})`);
  return res.json();
}

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
  return score >= 60
    ? "bg-primary/10 text-primary"
    : "bg-muted text-muted-foreground";
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
    <article className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex flex-wrap items-center gap-2">
        {studyType && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeTone(studyType)}`}>
            {studyType}
          </span>
        )}
        {paper.journal && (
          <span className="text-[12px] text-muted-foreground">
            {paper.journal}
            {paper.year ? ` · ${paper.year}` : ""}
          </span>
        )}
      </div>
      <h3 className="mt-2 font-serif text-lg leading-snug text-ink">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary hover:underline"
        >
          {paper.title}
        </a>
      </h3>
      {paper.abstract && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {truncateAbstract(paper.abstract)}
        </p>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-[13px] font-semibold text-primary hover:underline"
      >
        {paper.doi ? "Read full text →" : "View on PubMed →"}
      </a>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
      <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted" />
      <div className="mt-1.5 h-4 w-5/6 animate-pulse rounded bg-muted" />
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
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ingredient-research", ingredientId],
    queryFn: () => fetchResearch(ingredientId),
    staleTime: 1000 * 60 * 60, // 1h client cache; server caches for 30 days
    retry: 1,
  });

  if (isLoading) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
          <ScientistAvatar talking size={40} />
          <span>Pulling up the research…</span>
        </div>
        <div className="grid gap-4">
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

  if (!papers.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-warm-white px-5 py-6 text-sm text-muted-foreground">
        No research found for this ingredient yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {papers.map((p) => (
        <PaperCard key={p.pmid} paper={p} />
      ))}
    </div>
  );
}
