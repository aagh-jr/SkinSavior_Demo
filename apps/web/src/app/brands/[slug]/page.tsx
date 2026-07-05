import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { getBrandPage, type BrandSort } from "@/lib/brands-db";

const SORTS: { value: BrandSort; label: string }[] = [
  { value: "top", label: "Top rated" },
  { value: "newest", label: "Newest" },
  { value: "az", label: "A–Z" },
];

const MONOGRAM_COLORS = [
  "#caa37f",
  "#9a4a2f",
  "#4a6b3f",
  "#7a93a8",
  "#c98a9b",
  "#8a7bb0",
];
function monogramColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return MONOGRAM_COLORS[h % MONOGRAM_COLORS.length];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandPage(slug);
  if (!brand) return { title: "Brand not found" };
  return {
    title: brand.name,
    description: `All ${brand.productCount} ${brand.name} products in the skinsavior catalog.`,
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { slug } = await params;
  const { category, sort } = await searchParams;
  const activeSort: BrandSort =
    sort === "newest" || sort === "az" ? sort : "top";

  const brand = await getBrandPage(slug, { category, sort: activeSort });
  if (!brand) notFound();

  // Build a query string preserving the other filter.
  const hrefWith = (next: { category?: string | null; sort?: BrandSort }) => {
    const p = new URLSearchParams();
    const cat = next.category === undefined ? category : next.category;
    const srt = next.sort ?? activeSort;
    if (cat) p.set("category", cat);
    if (srt !== "top") p.set("sort", srt);
    const qs = p.toString();
    return `/brands/${brand.slug}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto w-full max-w-[1180px] px-6 py-12 md:px-14 md:py-16">
        <Link
          href="/brands"
          className="text-[13px] text-muted-foreground transition-colors hover:text-ink"
        >
          ← All brands
        </Link>

        {/* Brand header */}
        <div className="mt-4 flex items-center gap-5">
          <div
            className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl font-serif text-3xl font-semibold text-white"
            style={{ background: monogramColor(brand.name) }}
          >
            {brand.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
              {brand.name}
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              {brand.productCount} {brand.productCount === 1 ? "product" : "products"}
              {brand.origin ? ` · ${brand.origin}` : ""}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-9 flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={hrefWith({ category: null })}
              className={
                "rounded-full border px-3.5 py-[7px] text-[13px] transition-colors " +
                (!category
                  ? "border-clay bg-secondary font-semibold text-clay"
                  : "border-border text-muted-foreground hover:text-ink")
              }
            >
              All
            </Link>
            {brand.categories.map((c) => {
              const active = category === c.key;
              return (
                <Link
                  key={c.key}
                  href={hrefWith({ category: c.key })}
                  className={
                    "rounded-full border px-3.5 py-[7px] text-[13px] transition-colors " +
                    (active
                      ? "border-clay bg-secondary font-semibold text-clay"
                      : "border-border text-muted-foreground hover:text-ink")
                  }
                >
                  {c.label}
                </Link>
              );
            })}
          </div>

          {/* Sort */}
          <div className="flex flex-shrink-0 items-center gap-1 rounded-full border border-border p-0.5">
            {SORTS.map((s) => {
              const active = activeSort === s.value;
              return (
                <Link
                  key={s.value}
                  href={hrefWith({ sort: s.value })}
                  className={
                    "rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors " +
                    (active
                      ? "bg-secondary text-clay"
                      : "text-muted-foreground hover:text-ink")
                  }
                >
                  {s.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Products */}
        {brand.products.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-warm-white px-6 py-12 text-center text-sm text-muted-foreground">
            No products in this category.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {brand.products.map((p) => (
              <Link
                key={p.slug}
                href={`/product/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#e6ddcf] bg-white transition-shadow hover:shadow-lg"
              >
                <div className="aspect-square w-full overflow-hidden">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          "repeating-linear-gradient(45deg,#e7ddcc 0 10px,#efe7d9 10px 20px)",
                      }}
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  {p.category ? (
                    <div className="text-[10px] uppercase tracking-[0.14em] text-[#9a4a2f]">
                      {p.category}
                    </div>
                  ) : null}
                  <div className="font-serif text-[15px] leading-tight text-ink">
                    {p.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
