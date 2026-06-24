import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SearchBar } from "@/components/SearchBar";
import { products } from "@/lib/products";

export const Route = createFileRoute("/home")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Your home · skinsavior" },
      {
        name: "description",
        content:
          "Your personalized skinsavior home — search products, see your current routine, and discover trending picks.",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-sm text-muted-foreground">
      Something went wrong: {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-center text-sm text-muted-foreground">Not found.</div>
  ),
});

function ProductCard({ p }: { p: (typeof products)[number] }) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: p.slug }}
      className="group flex w-[260px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#e6ddcf] bg-white transition-shadow hover:shadow-lg"
    >
      <div
        className="aspect-[4/3] w-full"
        style={{
          background:
            "repeating-linear-gradient(45deg,#e7ddcc 0 10px,#efe7d9 10px 20px)",
        }}
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#9a4a2f]">
          {p.brand} · {p.category}
        </div>
        <div className="font-serif text-lg leading-tight text-ink">{p.name}</div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-semibold text-ink">{p.price}</span>
          <span className="rounded-full bg-[#fbf3ec] px-2.5 py-1 text-[11px] font-semibold text-[#9a4a2f]">
            {p.match}% match
          </span>
        </div>
      </div>
    </Link>
  );
}

function Marquee({ items }: { items: typeof products }) {
  // Duplicate for seamless loop
  const loop = [...items, ...items];
  return (
    <div className="group relative overflow-hidden">
      <div
        className="flex w-max gap-5 animate-[marquee_40s_linear_infinite] group-hover:[animation-play-state:paused]"
      >
        {loop.map((p, i) => (
          <ProductCard key={`${p.slug}-${i}`} p={p} />
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function HomePage() {
  const routine = products; // user's current routine = all 3 demo products
  const trending = [...products].reverse();

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Hero search */}
      <section className="mx-auto max-w-[1180px] px-6 pb-10 pt-16 md:px-14 md:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#9a4a2f]">
            Welcome back
          </p>
          <h1 className="font-serif text-4xl leading-tight text-ink md:text-5xl">
            What are we decoding today?
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Search any product or ingredient to see how it fits your skin.
          </p>
          <div className="mt-7 flex justify-center">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Current routine */}
      <section className="mx-auto max-w-[1180px] px-6 py-8 md:px-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-ink md:text-3xl">
              Your current routine
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              3 products · last updated this week
            </p>
          </div>
          <Link
            to="/routines"
            className="text-xs font-semibold text-[#9a4a2f] hover:underline"
          >
            Manage routine →
          </Link>
        </div>
        <Marquee items={routine} />
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-[1180px] px-6 py-8 pb-24 md:px-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-ink md:text-3xl">
              Trending products
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              What the community is loving this week
            </p>
          </div>
          <Link
            to="/search"
            search={{ q: "" }}
            className="text-xs font-semibold text-[#9a4a2f] hover:underline"
          >
            Browse all →
          </Link>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]">
          {trending.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
          {trending.map((p) => (
            <ProductCard key={`t2-${p.slug}`} p={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
