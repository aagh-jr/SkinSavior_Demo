import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { listBrands } from "@/lib/brands-db";

export const metadata: Metadata = {
  title: "Brands",
  description:
    "Browse every brand in the skinsavior catalog. See their products, origins, and how they fit your skin.",
};

// A soft, deterministic monogram color per brand so the grid reads as a system.
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

export default async function BrandsPage() {
  const brands = await listBrands();

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto w-full max-w-[1180px] px-6 py-12 md:px-14 md:py-16">
        <div className="mb-2 text-[13px] text-muted-foreground">Catalog / Brands</div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
          Brands
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every brand in the catalog. Open one to see all of its products, filter by
          category, and sort by what matters to you.
        </p>

        {brands.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-warm-white px-6 py-12 text-center text-sm text-muted-foreground">
            No brands yet — add a product to get started.
          </div>
        ) : (
          <>
            <div className="mt-8 text-[13px] text-muted-foreground">
              {brands.length} {brands.length === 1 ? "brand" : "brands"}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {brands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/brands/${b.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-clay"
                >
                  <div
                    className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl font-serif text-xl font-semibold text-white"
                    style={{ background: monogramColor(b.name) }}
                  >
                    {b.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-serif text-lg font-semibold text-ink">
                      {b.name}
                    </div>
                    <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      {b.productCount} {b.productCount === 1 ? "product" : "products"}
                      {b.origin ? ` · ${b.origin}` : ""}
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-[13px] font-semibold text-clay opacity-0 transition-opacity group-hover:opacity-100">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
