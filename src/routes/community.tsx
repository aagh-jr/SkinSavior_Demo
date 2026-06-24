import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — skinsavior" },
      {
        name: "description",
        content: "Real reviews and conversations from people with skin like yours.",
      },
    ],
  }),
  component: CommunityPage,
});

const POSTS = [
  {
    author: "Maya R.",
    profile: "Combo · Sensitive",
    text: "Three weeks on the Centella toner and my cheek redness has visibly dropped. Slow ingredient, real result.",
    likes: 184,
  },
  {
    author: "Jordan K.",
    profile: "Oily · Acne-prone",
    text: "BHA 3x a week + niacinamide AM has been a quieter routine than retinol and my skin loves it.",
    likes: 122,
  },
  {
    author: "Priya S.",
    profile: "Dry · Brightening",
    text: "Vitamin C in the morning under SPF — the glow is real after about a month. Don't skip the sunscreen.",
    likes: 97,
  },
];

function CommunityPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-[920px] px-6 py-12 md:px-12 md:py-16">
        <div className="mb-2 text-[13px] text-muted-foreground">Social / Community</div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
          Real skin, real reviews
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Conversations from people with skin profiles like yours — sentiment only, never
          factored into match scores.
        </p>

        <div className="mt-10 flex flex-col gap-4">
          {POSTS.map((p) => (
            <article
              key={p.author}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/80" />
                <div>
                  <div className="text-sm font-semibold text-ink">{p.author}</div>
                  <div className="text-xs text-muted-foreground">{p.profile}</div>
                </div>
              </div>
              <p className="mt-4 font-serif text-[19px] italic leading-relaxed text-ink">
                "{p.text}"
              </p>
              <div className="mt-4 text-xs text-muted-foreground">♡ {p.likes} found this helpful</div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
