import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { rollupEvidence, type Certainty } from "@skinsavior/core/research";
import { SiteNav } from "@/components/SiteNav";
import { ProductThumb } from "@/components/ProductThumb";
import { getProduct, products } from "@/lib/products";
import { getDbProduct, getProductResearchIngredients } from "@/lib/products-db";
import { listClaimsForIngredients } from "@/lib/claims-db";
import { brandSlug } from "@/lib/brands-db";
import { MatchScore } from "@/components/products/MatchScore";
import { scoreProductForMe } from "@/lib/match-db";
import { ProductResearch } from "@/components/research/ProductResearch";
import { EvidenceExplainer } from "@/components/research/EvidenceExplainer";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug) ?? (await getDbProduct(slug));
  return { title: p ? p.name : "Product" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Static demo products first, then products ingested via /add.
  const p = getProduct(slug) ?? (await getDbProduct(slug));
  if (!p) notFound();

  // Null when signed out or the quiz isn't taken — the panel prompts instead.
  const matchResult = await scoreProductForMe(slug);

  const researchIngredients = await getProductResearchIngredients(slug);
  // Graded evidence for this product's researched actives, strongest first.
  const claimsByIngredient = await listClaimsForIngredients(
    researchIngredients.map((r) => r.ingredientId),
  );
  const evidenceClaims = [...claimsByIngredient.values()]
    .flat()
    .sort((a, b) => b.notches - a.notches);
  // Deterministic product-level rollup — a statement about the evidence, in the
  // same colour language as the per-claim meter (sage strong, clay thin).
  const rollup = rollupEvidence(evidenceClaims.map((c) => c.certainty));
  const rollupColor: Record<Certainty, string> = {
    strong: "#5a7a4a",
    moderate: "#5a7a4a",
    limited: "#9a4a2f",
    very_limited: "#9a8c75",
  };
  const related = products.filter((x) => x.slug !== p.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f6f1e9] font-sans text-[#2a241d]">
      <SiteNav />

      <div className="mx-auto max-w-[1080px] px-6 pb-24 pt-9 md:px-12">
        <div className="mb-4 text-[13px] text-[#9a8c75]">
          <Link href="/search" className="hover:underline">
            {p.breadcrumb}
          </Link>
        </div>

        {/* HERO */}
        <div className="flex flex-col gap-11 md:flex-row md:items-start">
          <div className="w-full flex-shrink-0 md:w-[380px]">
            <ProductThumb
              category={p.category}
              imageUrl={p.imageUrl}
              name={p.name}
              className="aspect-square w-full overflow-hidden rounded-2xl"
              iconSize={96}
            />
            {/* Thumbnail strip intentionally omitted: products carry a single
                photo. Reintroduce this driven by a real image gallery only when
                a product can have more than one image. */}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <Link
                href={`/brands/${brandSlug(p.brand)}`}
                className="text-[13px] font-semibold uppercase tracking-wider text-[#9a4a2f] hover:underline"
              >
                {p.brand}
              </Link>
              <span className="text-xs text-[#9a8c75]">·</span>
              <span className="text-[13px] text-[#6b5f4f]">{p.origin}</span>
            </div>
            <h1 className="mt-2 font-serif text-[42px] font-medium leading-[1.08] tracking-tight text-[#1d1812]">
              {p.name}
            </h1>

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
                {p.price && (
                  <span className="font-serif text-[28px] font-semibold text-[#1d1812]">{p.price}</span>
                )}
                {p.retailerCount > 0 && (
                  <span className="text-[13px] text-[#9a8c75]">from {p.retailerCount} retailers</span>
                )}
              </div>
              {p.retailers.length > 0 && (
                <button className="ml-auto rounded-xl bg-[#9a4a2f] px-5 py-3 text-[15px] font-semibold text-white hover:opacity-90">
                  Where to buy ↓
                </button>
              )}
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

        {/* FOR YOUR SKIN — deterministic match score with the reasons behind
            it, plus any safety block. Rendered here (not further down) because
            a "not recommended while pregnant" warning has to be visible
            without scrolling. Null result = signed out or quiz not taken, and
            the panel prompts instead of inventing a number. */}
        <div className="mt-8">
          <MatchScore result={matchResult} />
        </div>

        {/* EVIDENCE — real per-claim grades when we have them; otherwise the
            legacy single-grade placeholder (static demo products). */}
        {evidenceClaims.length > 0 ? (
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="m-0 font-serif text-[26px] font-medium text-[#1d1812]">
                Evidence &amp; efficacy
              </h2>
              <div className="mt-0.5 text-[13px] text-[#9a8c75]">
                How much research backs each active — objective, same for everyone.
              </div>
              {rollup && (
                <div
                  className="mt-1.5 text-[14px] font-semibold"
                  style={{ color: rollupColor[rollup.best] }}
                >
                  {rollup.headline}
                </div>
              )}
            </div>
            <EvidenceExplainer claims={evidenceClaims} showIngredient />
          </div>
        ) : (
          <div className="mt-8">
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
            </div>
          </div>
        )}

        {/* INGREDIENTS */}
        <div className="mt-9">
          <div className="flex items-baseline justify-between">
            <h2 className="m-0 font-serif text-[26px] font-medium text-[#1d1812]">What&apos;s inside</h2>
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
        {p.safety.length > 0 && (
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
        )}

        {/* WHERE TO BUY */}
        {p.retailers.length > 0 && (
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
        )}

        {/* COMMUNITY */}
        {p.reviewCount > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="m-0 font-serif text-[26px] font-medium text-[#1d1812]">
                From the community
              </h2>
              <div className="mt-0.5 text-[13px] text-[#9a8c75]">
                Real reviews — sentiment only, doesn&apos;t change your match score.
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
                    &quot;{r.text}&quot;
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
        )}

        {/* RESEARCH — top papers for the product's most-researched ingredients. */}
        {researchIngredients.length > 0 && (
          <div className="mt-9">
            <h2 className="m-0 font-serif text-[26px] font-medium text-[#1d1812]">
              The research
            </h2>
            <div className="mt-1 text-[13px] text-[#9a8c75]">
              Top PubMed papers
              {researchIngredients.length > 1 ? " — pick an ingredient" : ""}. Titles link to the
              source.
            </div>
            <div className="mt-4">
              <ProductResearch ingredients={researchIngredients} />
            </div>
          </div>
        )}

        {/* RELATED */}
        <div className="mt-12">
          <h2 className="m-0 font-serif text-[26px] font-medium text-[#1d1812]">
            More to explore
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/product/${r.slug}`}
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
