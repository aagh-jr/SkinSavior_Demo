import { createFileRoute, Link } from "@tanstack/react-router";
import { SearchBar } from "@/components/SearchBar";
import { getProduct, products, type Product } from "@/lib/products";

export const Route = createFileRoute("/product/$slug")({
  head: () => ({
    meta: [{ title: "Product — skinsavior" }],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-[#f6f1e9] p-12 text-[#2a241d]">
      <div className="font-serif text-3xl">Product not found</div>
      <Link to="/search" search={{ q: "" }} className="mt-4 inline-block text-[#9a4a2f] underline">
        Browse all products →
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-[#f6f1e9] p-12">
      <div className="font-serif text-2xl text-[#1d1812]">Something went wrong</div>
      <div className="mt-2 text-sm text-[#6b5f4f]">{error.message}</div>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const p: Product | undefined = getProduct(slug);
  if (!p) {
    return (
      <div className="min-h-screen bg-[#f6f1e9] p-12 text-[#2a241d]">
        <div className="font-serif text-3xl">Product not found</div>
        <Link to="/search" search={{ q: "" }} className="mt-4 inline-block text-[#9a4a2f] underline">
          Browse all products →
        </Link>
      </div>
    );
  }
  const related = products.filter((x) => x.slug !== p.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f6f1e9] font-sans text-[#2a241d]">
      {/* nav */}
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
          <SearchBar />
          <div className="h-9 w-9 rounded-full bg-[#9a4a2f]" />
        </div>
      </header>

      <div className="mx-auto max-w-[1080px] px-6 pb-24 pt-9 md:px-12">
        <div className="mb-4 text-[13px] text-[#9a8c75]">
          <Link to="/search" search={{ q: "" }} className="hover:underline">
            {p.breadcrumb}
          </Link>
        </div>

        {/* HERO */}
        <div className="flex flex-col gap-11 md:flex-row md:items-start">
          <div className="w-full flex-shrink-0 md:w-[380px]">
            <div
              className="relative flex aspect-square items-end overflow-hidden rounded-2xl p-4"
              style={{
                background:
                  "repeating-linear-gradient(45deg,#e7ddcc 0 14px,#efe7d9 14px 28px)",
              }}
            >
              <span className="rounded-md bg-white/75 px-2 py-1 font-mono text-xs tracking-wide text-[#3c2d19]/60">
                product shot
              </span>
            </div>
            <div className="mt-2.5 flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="aspect-square flex-1 rounded-lg"
                  style={{
                    background:
                      "repeating-linear-gradient(45deg,#e7ddcc 0 8px,#efe7d9 8px 16px)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[13px] font-semibold uppercase tracking-wider text-[#9a4a2f]">
                {p.brand}
              </span>
              <span className="text-xs text-[#9a8c75]">·</span>
              <span className="text-[13px] text-[#6b5f4f]">{p.origin}</span>
            </div>
            <h1 className="mt-2 font-serif text-[42px] font-medium leading-[1.08] tracking-tight text-[#1d1812]">
              {p.name}
            </h1>

            <div className="mt-5 flex items-center gap-3.5">
              <div className="flex h-[66px] w-[66px] flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-[#9a4a2f] text-white">
                <span className="font-serif text-[23px] font-semibold leading-none">{p.match}%</span>
                <span className="text-[9px] uppercase tracking-widest opacity-85">match</span>
              </div>
              <div>
                <div className="text-base font-bold text-[#1d1812]">Great match for your skin</div>
                <div className="text-[13px] text-[#6b5f4f]">
                  Personalized by skinsavior AI to <strong>{p.matchFor}</strong>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {p.badges.map((b) => (
                <span
                  key={b}
                  className="rounded-full bg-[#eef3ea] px-3 py-1.5 text-[13px] font-medium text-[#4a6b3f]"
                >
                  {b}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-[28px] font-semibold text-[#1d1812]">{p.price}</span>
                <span className="text-[13px] text-[#9a8c75]">from {p.retailerCount} retailers</span>
              </div>
              <button className="ml-auto rounded-xl bg-[#9a4a2f] px-5 py-3 text-[15px] font-semibold text-white hover:opacity-90">
                Where to buy ↓
              </button>
              <button className="rounded-xl border border-[#caa37f] px-4 py-3 text-[15px] font-semibold text-[#9a4a2f] hover:bg-[#fff7ea]">
                ♡ Save
              </button>
            </div>
          </div>
        </div>

        <div className="my-9 h-px bg-[#e6ddcf]" />

        <p className="m-0 max-w-[780px] font-serif text-[22px] leading-[1.55] text-[#3a3228]">
          {p.description}
        </p>

        {/* FOR YOU + EVIDENCE */}
        <div className="mt-8 grid gap-3.5 md:grid-cols-2">
          <div className="rounded-xl border border-[#e6d3c4] bg-[#fbf3ec] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-[52px] w-[52px] flex-shrink-0 flex-col items-center justify-center rounded-xl bg-[#9a4a2f] text-white">
                <span className="font-serif text-lg font-semibold leading-none">{p.match}%</span>
              </div>
              <div>
                <div className="text-[15px] font-bold text-[#1d1812]">For you · great match</div>
                <div className="text-xs text-[#9a8c75]">
                  skinsavior AI · from your skin profile &amp; log
                </div>
              </div>
            </div>
            <div className="mt-3.5 flex flex-col gap-1.5">
              {p.forYou.good.map((g) => (
                <div key={g} className="text-[13px] text-[#4a6b3f]">
                  {g}
                </div>
              ))}
              {p.forYou.warn.map((w) => (
                <div key={w} className="text-[13px] text-[#9a4a2f]">
                  {w}
                </div>
              ))}
            </div>
            <div className="mt-3.5 border-t border-[#ecdfce] pt-3 text-xs text-[#6b5f4f]">
              {p.rank}
            </div>
          </div>
          <div className="rounded-xl border border-[#e6ddcf] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-xl border border-[#e0d6c4] bg-[#f1ede4]">
                <span className="font-serif text-[21px] font-semibold text-[#5a7a4a]">
                  {p.evidenceGrade}
                </span>
              </div>
              <div>
                <div className="text-[15px] font-bold text-[#1d1812]">Evidence &amp; efficacy</div>
                <div className="text-xs text-[#9a8c75]">objective · same for everyone</div>
              </div>
            </div>
            <p className="mt-3.5 text-[13px] leading-relaxed text-[#6b5f4f]">{p.evidenceText}</p>
            <div className="mt-3 text-[13px] font-semibold text-[#9a4a2f]">See sources →</div>
          </div>
        </div>

        {/* INGREDIENTS */}
        <div className="mt-9">
          <div className="flex items-baseline justify-between">
            <h2 className="m-0 font-serif text-[26px] font-medium text-[#1d1812]">What's inside</h2>
            <span className="text-[13px] font-semibold text-[#9a4a2f]">
              {p.ingredients.length} ingredients · tap to decode
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-px overflow-hidden rounded-xl border border-[#e6ddcf] bg-[#e6ddcf]">
            {p.ingredients.map((ing) => (
              <div
                key={ing.name}
                className="flex items-center justify-between bg-[#fdfbf6] px-4 py-3.5 hover:bg-[#fff7ea]"
              >
                <div>
                  <span className="text-[15px] font-semibold">{ing.name}</span>
                  {ing.pct && <span className="ml-2 text-xs text-[#9a8c75]">{ing.pct}</span>}
                </div>
                <div className="flex gap-1.5">
                  {ing.tags.map((t) => (
                    <span
                      key={t.label}
                      className={
                        "rounded-md px-2 py-1 text-xs " +
                        (t.tone === "good"
                          ? "bg-[#e9f0e6] text-[#4a6b3f]"
                          : t.tone === "warn"
                          ? "bg-[#f6ece2] text-[#9a4a2f]"
                          : "bg-[#f1ede4] text-[#6b5f4f]")
                      }
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SAFETY */}
        <div className="mt-9">
          <h2 className="m-0 font-serif text-[26px] font-medium text-[#1d1812]">
            Safety &amp; allergens
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#e6ddcf] bg-[#e6ddcf] sm:grid-cols-2">
            {p.safety.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between bg-[#fdfbf6] px-4 py-3.5"
              >
                <span className="text-sm text-[#6b5f4f]">{s.label}</span>
                <span
                  className={
                    "text-sm font-semibold " +
                    (s.tone === "good" ? "text-[#4a6b3f]" : "text-[#9a4a2f]")
                  }
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* WHERE TO BUY */}
        <div className="mt-9">
          <h2 className="m-0 font-serif text-[26px] font-medium text-[#1d1812]">Where to buy</h2>
          <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-5">
            {p.retailers.map((r) => (
              <div
                key={r.name}
                className="cursor-pointer rounded-xl border border-[#e6ddcf] bg-white p-4 hover:border-[#caa37f] hover:bg-[#fffaf2]"
              >
                <div className="text-[15px] font-semibold">{r.name}</div>
                <div
                  className={
                    "mt-1 text-sm " + (r.highlight ? "text-[#9a4a2f]" : "text-[#6b5f4f]")
                  }
                >
                  {r.price} →
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COMMUNITY */}
        <div className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="m-0 font-serif text-[26px] font-medium text-[#1d1812]">
                From the community
              </h2>
              <div className="mt-0.5 text-[13px] text-[#9a8c75]">
                Real reviews — sentiment only, doesn't change your match score.
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-serif text-[28px] font-semibold text-[#1d1812]">
                {p.rating}
              </span>
              <div>
                <div className="text-sm tracking-widest text-[#c8821f]">★★★★★</div>
                <div className="text-xs text-[#6b5f4f]">
                  {p.reviewCount.toLocaleString()} reviews
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-5">
            {p.reviews.map((r) => (
              <div key={r.author} className="flex gap-4">
                <div
                  className="h-10 w-10 flex-shrink-0 rounded-full"
                  style={{ background: r.color }}
                />
                <div>
                  <p className="m-0 font-serif text-[19px] italic leading-[1.5] text-[#2a241d]">
                    "{r.text}"
                  </p>
                  <div className="mt-2 text-[13px] text-[#9a8c75]">
                    {r.author} · {r.profile} · {r.stars}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-5 rounded-xl border border-[#caa37f] bg-transparent px-5 py-3 text-sm font-semibold text-[#9a4a2f] hover:bg-[#fff7ea]">
            Read all {p.reviewCount.toLocaleString()} reviews
          </button>
        </div>

        {/* RELATED */}
        <div className="mt-12">
          <h2 className="m-0 font-serif text-[26px] font-medium text-[#1d1812]">
            More to explore
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                to="/product/$slug"
                params={{ slug: r.slug }}
                className="rounded-xl border border-[#e6ddcf] bg-white p-5 hover:border-[#caa37f] hover:bg-[#fffaf2]"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9a4a2f]">
                  {r.brand}
                </div>
                <div className="mt-1 font-serif text-lg text-[#1d1812]">{r.name}</div>
                <div className="mt-2 text-sm text-[#6b5f4f]">{r.tagline}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
