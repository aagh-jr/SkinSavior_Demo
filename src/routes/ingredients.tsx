import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/ingredients")({
  head: () => ({
    meta: [
      { title: "Ingredients — skinsavior" },
      {
        name: "description",
        content:
          "Decode skincare ingredients. What they do, who they suit, and the research behind them.",
      },
    ],
  }),
  component: IngredientsPage,
});

const INGREDIENTS = [
  {
    name: "Niacinamide",
    tag: "Brightening · Barrier",
    blurb:
      "A form of vitamin B3 that calms redness, supports the barrier, and visibly evens tone over 8–12 weeks at 2–5%.",
    grade: "A",
  },
  {
    name: "Vitamin C (L-Ascorbic Acid)",
    tag: "Antioxidant · Brightening",
    blurb:
      "Neutralizes daytime free radicals and fades hyperpigmentation. Best at 10–20% with a low pH — stable formulas matter.",
    grade: "A",
  },
  {
    name: "Retinol",
    tag: "Renewal · Anti-aging",
    blurb:
      "The most studied anti-aging ingredient. Speeds turnover, improves fine lines and texture. Start low, build slowly.",
    grade: "A",
  },
  {
    name: "Salicylic Acid",
    tag: "Acne · Pores",
    blurb:
      "Oil-soluble BHA that clears congestion inside pores. Excellent for combination and oily skin at 0.5–2%.",
    grade: "A",
  },
  {
    name: "Centella Asiatica",
    tag: "Calming · Sensitive",
    blurb:
      "A botanical with real clinical data for reducing redness and supporting wound healing. Great for reactive skin.",
    grade: "B",
  },
  {
    name: "Hyaluronic Acid",
    tag: "Hydration",
    blurb:
      "A humectant that holds water in the upper skin layers. Layer onto damp skin and seal with a moisturizer.",
    grade: "B",
  },
];

function IngredientsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-[1080px] px-6 py-12 md:px-12 md:py-16">
        <div className="mb-2 text-[13px] text-muted-foreground">Library / Ingredients</div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
          The ingredients library
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          What's actually in your skincare — explained in plain English, graded by the
          weight of real research.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {INGREDIENTS.map((i) => (
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
      </main>
    </div>
  );
}
