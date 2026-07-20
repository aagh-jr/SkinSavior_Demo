import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isResearched } from "@skinsavior/core/research";
import { SiteNav } from "@/components/SiteNav";
import { IngredientResearch } from "@/components/research/IngredientResearch";
import { EvidenceExplainer } from "@/components/research/EvidenceExplainer";
import { getIngredient } from "@/lib/ingredients-db";
import { listClaimsForIngredient } from "@/lib/claims-db";

function titleCase(s: string): string {
  return s.replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ing = await getIngredient(id);
  return { title: ing ? titleCase(ing.common_name || ing.inci_name) : "Ingredient" };
}

export default async function IngredientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ing = await getIngredient(id);
  if (!ing) notFound();

  const name = titleCase(ing.common_name?.trim() || ing.inci_name);
  const inci = titleCase(ing.inci_name);
  const functions = ing.functions ?? [];
  const researched = isResearched(ing.inci_name);
  const claims = await listClaimsForIngredient(id);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-[820px] px-6 py-12 md:px-12 md:py-16">
        <div className="mb-2 text-[13px] text-muted-foreground">
          <Link href="/ingredients" className="hover:underline">
            Library / Ingredients
          </Link>
        </div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
          {name}
        </h1>
        {inci !== name && <div className="mt-2 text-sm text-muted-foreground">{inci}</div>}

        {functions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {functions.map((f) => (
              <span
                key={f}
                className="rounded-full bg-muted px-3 py-1 text-[12px] font-medium text-muted-foreground"
              >
                {titleCase(f)}
              </span>
            ))}
          </div>
        )}

        {ing.description?.trim() && (
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-foreground">
            {ing.description.trim()}
          </p>
        )}

        {ing.safety_notes?.trim() && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-semibold text-ink">Safety notes</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {ing.safety_notes.trim()}
            </p>
          </div>
        )}

        {/* EVIDENCE — computed grades for this ingredient's benefit claims. */}
        {claims.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-medium text-ink">What the evidence says</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              How much research backs each benefit. Tap a card for the reasoning and the studies.
            </p>
            <div className="mt-5">
              <EvidenceExplainer claims={claims} />
            </div>
          </section>
        )}

        {/* RESEARCH — only for ingredients in the research pilot. */}
        {researched && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-medium text-ink">Research</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              The most relevant papers from PubMed. Titles link to the source.
            </p>
            <div className="mt-5">
              <IngredientResearch ingredientId={id} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
