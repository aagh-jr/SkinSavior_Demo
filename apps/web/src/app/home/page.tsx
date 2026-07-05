import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SearchBar } from "@/components/SearchBar";
import { ProductThumb } from "@/components/ProductThumb";
import { products } from "@/lib/products";
import { getHomeRoutine, type BuilderStep } from "@/lib/routines-db";
import { ROUTINE_CATEGORIES } from "@/lib/routine-categories";

export const metadata: Metadata = {
  title: "Your home",
  description:
    "Your personalized skinsavior home — search products, see your current routine, and discover trending picks.",
};

function ProductCard({ p }: { p: (typeof products)[number] }) {
  return (
    <Link
      href={`/product/${p.slug}`}
      className="group flex w-[260px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#e6ddcf] bg-white transition-shadow hover:shadow-lg"
    >
      <ProductThumb
        category={p.category}
        name={p.name}
        className="aspect-[4/3] w-full"
        iconSize={48}
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#9a4a2f]">
          {p.brand} · {p.category}
        </div>
        <div className="font-serif text-lg leading-tight text-ink">{p.name}</div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-semibold text-ink">{p.price}</span>
        </div>
      </div>
    </Link>
  );
}

const CATEGORY_LABELS = new Map(
  ROUTINE_CATEGORIES.map((c) => [c.value, c.label] as const),
);

function RoutineStepCard({ step }: { step: BuilderStep }) {
  const category = CATEGORY_LABELS.get(step.category) ?? step.category;
  const inner = (
    <>
      <div className="aspect-[4/3] w-full overflow-hidden">
        <ProductThumb
          category={step.category}
          imageUrl={step.productImage}
          name={step.productName}
          className="h-full w-full"
          iconSize={48}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#9a4a2f]">
          {step.productBrand ? `${step.productBrand} · ` : ""}
          {category}
        </div>
        <div className="font-serif text-lg leading-tight text-ink">
          {step.productName}
        </div>
      </div>
    </>
  );

  const className =
    "group flex w-[260px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#e6ddcf] bg-white transition-shadow hover:shadow-lg";
  return step.productSlug ? (
    <Link href={`/product/${step.productSlug}`} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

export default async function HomePage() {
  const homeRoutine = await getHomeRoutine();
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

      {/* Current routine — the user's primary routine (manually scrollable) */}
      <section className="mx-auto max-w-[1180px] px-6 py-8 md:px-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-ink md:text-3xl">
              Your current routine
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {homeRoutine
                ? `${homeRoutine.name} · ${homeRoutine.steps.length} ${
                    homeRoutine.steps.length === 1 ? "product" : "products"
                  }`
                : "You haven't built a routine yet"}
            </p>
          </div>
          <Link
            href={homeRoutine ? `/routines/${homeRoutine.id}` : "/routines"}
            className="text-xs font-semibold text-[#9a4a2f] hover:underline"
          >
            {homeRoutine ? "Manage routine →" : "Build one →"}
          </Link>
        </div>

        {homeRoutine && homeRoutine.steps.length > 0 ? (
          <div className="flex gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]">
            {homeRoutine.steps.map((step) => (
              <RoutineStepCard key={step.id} step={step} />
            ))}
          </div>
        ) : (
          <Link
            href={homeRoutine ? `/routines/${homeRoutine.id}` : "/routines"}
            className="flex items-center justify-center rounded-2xl border border-dashed border-[#d8ccba] bg-warm-white px-6 py-12 text-sm font-semibold text-clay transition-colors hover:bg-[#fff7ea]"
          >
            {homeRoutine
              ? "+ Add products to your routine"
              : "+ Build your first routine"}
          </Link>
        )}
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
            href="/search"
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
