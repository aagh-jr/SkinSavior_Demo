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
import { IngredientDecoder, KeyCard } from "@/components/products/IngredientDecoder";
import { EvidenceByClaim } from "@/components/products/EvidenceByClaim";
import { SaveButton } from "@/components/products/SaveButton";
import { getSaveStateBySlug } from "@/lib/shelf-db";
import { scoreProductForMe } from "@/lib/match-db";
import { ProductResearch } from "@/components/research/ProductResearch";
import { EvidenceExplainer } from "@/components/research/EvidenceExplainer";

/**
 * Never cached — the page renders per-viewer content: the match score, its
 * safety blocks, and the save-to-shelf state. A cached copy would show one
 * user's result to everyone, and a safety block that a cache can hide is not
 * a block.
 */
export const dynamic = "force-dynamic";

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
  const saveState = await getSaveStateBySlug(slug);

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
    strong: "#159A6B",
    moderate: "#159A6B",
    limited: "#DC2A2A",
    very_limited: "#5B6472",
  };
  const related = products.filter((x) => x.slug !== p.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background font-sans text-ink">
      <SiteNav />

      <div className="mx-auto max-w-[1080px] px-6 pb-24 pt-9 md:px-12">
        <div className="mb-4 text-[13px] text-faint">
          <Link href="/search" className="hover:underline">
            {p.breadcrumb}
          </Link>
        </div>

        {/* HERO */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <div className="w-full flex-shrink-0 md:w-[300px]">
            <ProductThumb
              category={p.category}
              imageUrl={p.imageUrl}
              name={p.name}
              className="aspect-square w-full overflow-hidden rounded-sm border border-soft-tan bg-cream"
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
                className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-faint hover:text-link"
              >
                {p.brand}
              </Link>
              <span className="text-xs text-faint">·</span>
              <span className="text-[13px] text-faint">{p.origin}</span>
            </div>
            <h1 className="mt-2 font-mono text-[40px] font-medium leading-[1.08] text-ink">
              {p.name}
            </h1>

            <div className="mt-5 flex flex-wrap gap-2">
              {p.badges.map((b) => (
                <span
                  key={b}
                  className="rounded-md bg-sage-bg px-3 py-1.5 text-[13px] font-medium text-sage"
                >
                  {b}
                </span>
              ))}
            </div>

            {/* The description and price sit together in one card beneath the
                title. */}
            <div className="mt-6 rounded-xl border border-soft-tan bg-cream p-5">
              <p className="m-0 font-serif text-[19px] leading-[1.55] text-ink">
                {p.description}
              </p>
              <div className="mt-[18px] flex items-center gap-3">
                {p.retailers.length > 0 && (
                  <a
                    href="#where-to-buy"
                    className="rounded-lg bg-primary px-5 py-3 text-[15px] font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Where to buy ↓
                  </a>
                )}
                {/* Was a decorative button that did nothing; now backed by
                    saved_products. Hidden when signed out or for the static demo
                    products, which have no catalogue row to save. */}
                {saveState.productId && (
                  <SaveButton
                    productId={saveState.productId}
                    initialSaved={saveState.saved}
                    signedIn={saveState.signedIn}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="my-9 h-px bg-soft-tan" />

        {/* YOUR MATCH — carries the match score, the reasons behind it, and —
            first and unconditionally — any safety block. Sits above ingredient
            analysis so a safety block is the first thing after the photo and
            summary, not buried alongside the ingredient list. */}
        <KeyCard
          match={matchResult}
          evidenceGrade={p.evidenceGrade}
          rating={p.rating}
          reviewCount={p.reviewCount}
          ingredientCount={p.ingredients.length}
        />

        <div className="my-9 h-px bg-soft-tan" />

        {/* WHAT'S INSIDE + INGREDIENT KEY — the redesigned interactive decoder.
            Clicking an ingredient opens its breakdown on the left, alongside
            the ingredient key legend and full list on the right. This replaces
            both the old standalone MatchScore panel and the static ingredient
            list below it. */}
        <h2 className="m-0 mb-5 font-mono text-[26px] font-medium text-ink">
          Ingredient analysis
        </h2>
        <IngredientDecoder
          ingredients={p.ingredients}
          forYou={p.forYou}
          researchLabels={new Set(researchIngredients.map((r) => r.label.toLowerCase()))}
        />

        {/* EVIDENCE BY CLAIM — new compact rollup (Paper "Product Profile 1"):
            one glanceable row per graded claim. Sits above the existing
            detailed accordion section below, which is untouched. */}
        {evidenceClaims.length > 0 && (
          <div className="mt-9">
            <h2 className="m-0 mb-5 font-mono text-[26px] font-medium text-ink">
              Evidence by claim
            </h2>
            <EvidenceByClaim claims={evidenceClaims} />
          </div>
        )}

        {/* EVIDENCE — real per-claim grades when we have them; otherwise the
            legacy single-grade placeholder (static demo products). */}
        {evidenceClaims.length > 0 ? (
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="m-0 font-mono text-[26px] font-medium text-ink">
                Evidence &amp; efficacy
              </h2>
              <div className="mt-0.5 text-[13px] text-faint">
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
            <div className="rounded-xl border border-soft-tan bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-xl border border-soft-tan bg-cream">
                  <span className="font-serif text-[21px] font-semibold text-sage">
                    {p.evidenceGrade}
                  </span>
                </div>
                <div>
                  <div className="text-[15px] font-bold text-ink">Evidence &amp; efficacy</div>
                  <div className="text-xs text-faint">objective · same for everyone</div>
                </div>
              </div>
              <p className="mt-3.5 text-[13px] leading-relaxed text-faint">{p.evidenceText}</p>
            </div>
          </div>
        )}

        {/* SAFETY */}
        {p.safety.length > 0 && (
        <div className="mt-9">
          <h2 className="m-0 font-mono text-[26px] font-medium text-ink">
            Safety &amp; allergens
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-soft-tan bg-soft-tan sm:grid-cols-2">
            {p.safety.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between bg-warm-white px-4 py-3.5"
              >
                <span className="text-sm text-faint">{s.label}</span>
                <span
                  className={
                    "text-sm font-semibold " +
                    (s.tone === "good" ? "text-sage" : "text-link")
                  }
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* WHERE TO BUY — prices live here, per retailer, not in the hero. A
            single headline price up top implied one true price; this is a
            comparison, not a snapshot. */}
        {p.retailers.length > 0 && (
        <div id="where-to-buy" className="mt-9 scroll-mt-24">
          <div className="flex items-baseline gap-2.5">
            <h2 className="m-0 font-mono text-[26px] font-medium text-ink">Where to buy</h2>
            {p.retailerCount > 0 && (
              <span className="text-[13px] text-faint">from {p.retailerCount} retailers</span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-5">
            {p.retailers.map((r) => (
              <div
                key={r.name}
                className="cursor-pointer rounded-xl border border-soft-tan bg-white p-4 hover:border-clay hover:bg-secondary"
              >
                <div className="text-[15px] font-semibold">{r.name}</div>
                <div
                  className={
                    "mt-1 text-sm " + (r.highlight ? "text-link" : "text-faint")
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
              <h2 className="m-0 font-mono text-[26px] font-medium text-ink">
                From the community
              </h2>
              <div className="mt-0.5 text-[13px] text-faint">
                Real reviews — sentiment only, doesn&apos;t change your match score.
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-serif text-[28px] font-semibold text-ink">
                {p.rating}
              </span>
              <div>
                <div className="text-sm tracking-widest text-clay-strong">★★★★★</div>
                <div className="text-xs text-faint">
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
                  <p className="m-0 font-serif text-[19px] italic leading-[1.5] text-ink">
                    &quot;{r.text}&quot;
                  </p>
                  <div className="mt-2 text-[13px] text-faint">
                    {r.author} · {r.profile} · {r.stars}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-5 rounded-xl border border-clay bg-transparent px-5 py-3 text-sm font-semibold text-link hover:bg-secondary">
            Read all {p.reviewCount.toLocaleString()} reviews
          </button>
        </div>
        )}

        {/* RESEARCH — top papers for the product's most-researched ingredients.
            id="research" is the anchor the ingredient decoder's "Read the
            research on PubMed" link scrolls to. */}
        {researchIngredients.length > 0 && (
          <div id="research" className="mt-9 scroll-mt-24">
            <h2 className="m-0 font-mono text-[26px] font-medium text-ink">
              The research
            </h2>
            <div className="mt-1 text-[13px] text-faint">
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
          <h2 className="m-0 font-mono text-[26px] font-medium text-ink">
            More to explore
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/product/${r.slug}`}
                className="rounded-xl border border-soft-tan bg-white p-5 hover:border-clay hover:bg-secondary"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wider text-link">
                  {r.brand}
                </div>
                <div className="mt-1 font-serif text-lg text-ink">{r.name}</div>
                <div className="mt-2 text-sm text-faint">{r.tagline}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
