import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { ProductThumb } from "@/components/ProductThumb";
import { searchProducts, products } from "@/lib/products";
import { searchDbProducts, listRecentDbProducts } from "@/lib/products-db";

export const metadata: Metadata = {
  title: "Search",
  description: "Search skincare products and ingredients.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  // Static demo products + live catalog, deduped by slug (demo wins).
  const staticResults = q ? searchProducts(q) : products;
  const dbResults = q ? await searchDbProducts(q) : await listRecentDbProducts();
  const staticSlugs = new Set(staticResults.map((p) => p.slug));
  const results = [...staticResults, ...dbResults.filter((p) => !staticSlugs.has(p.slug))];

  return (
    <div className="min-h-screen bg-[#f6f1e9] font-sans text-[#2a241d]">
      <SiteNav />

      <main className="mx-auto max-w-[1080px] px-6 py-10 md:px-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 text-[13px] text-[#9a8c75]">Products / Search</div>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-[#1d1812]">
              {q ? (
                <>
                  Results for <em>&quot;{q}&quot;</em>
                </>
              ) : (
                <>All products</>
              )}
            </h1>
            <div className="mt-2 text-sm text-[#6b5f4f]">
              {results.length} {results.length === 1 ? "product" : "products"} found
            </div>
          </div>
          <Link
            href="/add"
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-[#9a4a2f] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <span aria-hidden="true">+</span> Add product
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <Link
              key={p.slug}
              href={`/product/${p.slug}`}
              className="group overflow-hidden rounded-2xl border border-[#e6ddcf] bg-white transition-colors hover:border-[#caa37f] hover:bg-[#fffaf2]"
            >
              <div className="relative aspect-square">
                <ProductThumb
                  category={p.category}
                  name={p.name}
                  className="absolute inset-0 h-full w-full"
                  iconSize={56}
                />
              </div>
              <div className="p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9a4a2f]">
                  {p.brand}
                  {p.origin ? ` · ${p.origin}` : ""}
                </div>
                <div className="mt-1.5 font-serif text-xl font-medium leading-tight text-[#1d1812]">
                  {p.name}
                </div>
                <div className="mt-1 text-sm text-[#6b5f4f]">{p.tagline}</div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="font-serif text-lg font-semibold text-[#1d1812]">{p.price}</span>
                  <span className="text-sm font-semibold text-[#9a4a2f] group-hover:underline">
                    View →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {results.length === 0 && (
          <div className="mt-12 rounded-xl border border-[#e6ddcf] bg-white px-6 py-12 text-center">
            <div className="font-serif text-2xl text-[#1d1812]">No matches found</div>
            <div className="mt-2 text-sm text-[#6b5f4f]">
              Try searching for &quot;serum&quot;, &quot;toner&quot;, or &quot;cream&quot;.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
