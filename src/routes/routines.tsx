import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/routines")({
  head: () => ({
    meta: [
      { title: "Routines — skinsavior" },
      {
        name: "description",
        content:
          "Build a skincare routine that fits your skin, your goals, and the time you actually have.",
      },
    ],
  }),
  component: RoutinesPage,
});

const ROUTINES = [
  {
    name: "Calm & Restore",
    fit: "Sensitive, reactive skin",
    steps: ["Gentle cleanser", "Centella toner", "Niacinamide serum", "Barrier cream", "SPF 50"],
  },
  {
    name: "Bright & Even",
    fit: "Dullness, dark spots",
    steps: ["Cream cleanser", "Vitamin C serum", "Hydrating essence", "Light moisturizer", "SPF 50"],
  },
  {
    name: "Clear & Smooth",
    fit: "Breakouts, congestion",
    steps: ["Gel cleanser", "BHA 2% (PM)", "Niacinamide serum", "Oil-free moisturizer", "SPF 50"],
  },
];

function RoutinesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-[1080px] px-6 py-12 md:px-12 md:py-16">
        <div className="mb-2 text-[13px] text-muted-foreground">Plans / Routines</div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
          Routines that actually fit
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Pre-built starting points — or take the quiz and we'll personalize one to your skin
          profile.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {ROUTINES.map((r) => (
            <article
              key={r.name}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <h2 className="font-serif text-xl font-semibold text-ink">{r.name}</h2>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                {r.fit}
              </div>
              <ol className="mt-5 space-y-2">
                {r.steps.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm text-ink">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-muted/40 p-8 text-center">
          <h3 className="font-serif text-2xl text-ink">Want one built around your skin?</h3>
          <p className="mt-2 text-muted-foreground">Take the 2-minute skin quiz.</p>
          <Link
            to="/quiz"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Start the quiz →
          </Link>
        </div>
      </main>
    </div>
  );
}
