import { createFileRoute, Link } from "@tanstack/react-router";
import { SearchBar } from "@/components/SearchBar";
import { searchProducts, products } from "@/lib/products";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { q: string } => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "Search — skinsavior" },
      { name: "description", content: "Search skincare products and ingredients." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const results = q ? searchProducts(q) : products;

  return (
    <div className="min-h-screen bg-[#f6f1e9] font-sans text-[#2a241d]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e6ddcf] bg-[#f6f1e9] px-6 py-5 md:px-12">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-serif text-2xl font-semibold tracking-tight text-[#1d1812]">
            skinsavior
          </Link>
          <div className="hidden gap-6 text-sm text-[#6b5f4f] md:flex">
            <Link to="/search" search={{ q: "" }} className="font-semibold text-[#9a4a2f]">
              Products
            </Link>
            <span>Ingredients</span>
            <span>Routines</span>
            <span>Community</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SearchBar initialQuery={q} />
          <div className="h-9 w-9 rounded-full bg-[#9a4a2f]" />
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-6 py-10 md:px-12">
        <div className="mb-2 text-[13px] text-[#9a8c75]">Products / Search</div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-[#1d1812]">
          {q ? <>Results for <em>"{q}"</em></> : <>All products</>}
        </h1>
        <div className="mt-2 text-sm text-[#6b5f4f]">
          {results.length} {results.length === 1 ? "product" : "products"} found
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <Link
              key={p.slug}
              to="/product/$slug"
              params={{ slug: p.slug }}
              className="group overflow-hidden rounded-2xl border border-[#e6ddcf] bg-white transition-colors hover:border-[#caa37f] hover:bg-[#fffaf2]"
            >
              <div
                className="relative flex aspect-square items-end p-4"
                style={{
                  background:
                    "repeating-linear-gradient(45deg,#e7ddcc 0 14px,#efe7d9 14px 28px)",
                }}
              >
                <span className="rounded-md bg-white/75 px-2 py-1 font-mono text-[11px] tracking-wide text-[#3c2d19]/60">
                  product shot
                </span>
                <div className="absolute right-3 top-3 flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-[#9a4a2f] text-white">
                  <span className="font-serif text-lg font-semibold leading-none">{p.match}%</span>
                  <span className="text-[8px] uppercase tracking-widest opacity-85">match</span>
                </div>
              </div>
              <div className="p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9a4a2f]">
                  {p.brand} · {p.origin}
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
              Try searching for "serum", "toner", or "cream".
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
