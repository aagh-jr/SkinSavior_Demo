import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { searchIngredients } from "@/lib/ingredients";

export const metadata: Metadata = {
  title: "Ingredients",
  description:
    "Decode skincare ingredients. What they do, who they suit, and the research behind them.",
};

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const ingredients = searchIngredients(q);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-[1080px] px-6 py-12 md:px-12 md:py-16">
        <div className="mb-2 text-[13px] text-muted-foreground">Library / Ingredients</div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
          The ingredients library
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {q.trim()
            ? `${ingredients.length} ${ingredients.length === 1 ? "ingredient" : "ingredients"} matching “${q.trim()}”.`
            : "What's actually in your skincare — explained in plain English, graded by the weight of real research."}
        </p>

        {ingredients.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-warm-white px-6 py-12 text-center text-sm text-muted-foreground">
            No ingredients matching “{q.trim()}”.
          </div>
        ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {ingredients.map((i) => (
            <article
              key={i.name}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-ink">{i.name}</h2>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {i.tag}
                  </div>
                </div>
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-muted font-serif text-lg font-semibold text-ink">
                  {i.grade}
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{i.blurb}</p>
            </article>
          ))}
        </div>
        )}
      </main>
    </div>
  );
}
