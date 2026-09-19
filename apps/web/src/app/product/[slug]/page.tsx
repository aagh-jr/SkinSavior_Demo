import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { ProductThumb } from "@/components/ProductThumb";
import { getDbProduct, getProductResearchIngredients, listRelatedDbProducts } from "@/lib/products-db";
import { listClaimsForIngredients } from "@/lib/claims-db";
import { brandSlug } from "@/lib/brands-db";
import { ProductProfileSplit } from "@/components/products/ProductProfileSplit";
import { EvidenceByClaim } from "@/components/products/EvidenceByClaim";
import { SaveButton } from "@/components/products/SaveButton";
import { getSaveStateBySlug } from "@/lib/shelf-db";
import { ResearchDropdown } from "@/components/research/ResearchDropdown";

/** Never cached because the page renders per-viewer save-to-shelf state. */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getDbProduct(slug);
  return { title: p ? p.name : "Product" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getDbProduct(slug);
  if (!p) notFound();

  const saveState = await getSaveStateBySlug(slug);

  const researchIngredients = await getProductResearchIngredients(slug);
  // Graded evidence for this product's researched actives, strongest first.
  const claimsByIngredient = await listClaimsForIngredients(
    researchIngredients.map((r) => r.ingredientId),
  );
  const evidenceClaims = [...claimsByIngredient.values()]
    .flat()
    .sort((a, b) => b.notches - a.notches);
  const related = await listRelatedDbProducts(p.slug, p.category);

  return (
    <div className="min-h-screen bg-background font-sans text-ink">
      <SiteNav />

      <div className="mx-auto max-w-[1440px] px-6 pb-24 pt-8 md:px-14">
        <div className="mb-6 text-[13px] text-faint">
          <Link href="/search" className="hover:underline">
            {p.breadcrumb}
          </Link>
        </div>

        {/* PROFILE SPLIT — one shared 4:6 hairline runs the full height. Left:
            image over ingredient analysis. Right: summary over ingredient list.
            Clicking an ingredient on the right opens its spotlight on the left,
            so the interactive halves live in one client component; the image
            and summary are passed in as server-rendered slots. */}
        <ProductProfileSplit
          ingredients={p.ingredients}
          researchLabels={new Set(researchIngredients.map((r) => r.label.toLowerCase()))}
          imageSlot={
            <ProductThumb
              category={p.category}
              imageUrl={p.imageUrl}
              name={p.name}
              className="h-[300px] w-[300px] max-w-full overflow-hidden rounded-lg border border-soft-tan bg-cream"
              iconSize={96}
            />
          }
          summarySlot={
            <>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    href={`/brands/${brandSlug(p.brand)}`}
                    className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-faint hover:text-link"
                  >
                    {p.brand}
                  </Link>
                  {p.origin && (
                    <>
                      <span className="text-xs text-faint">·</span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
                        {p.origin}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="m-0 font-serif text-[40px] font-medium leading-[44px] tracking-[-0.01em] text-ink">
                  {p.name}
                </h1>
              </div>

              {p.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {p.badges.map((b) => (
                    <span
                      key={b}
                      className="rounded-md bg-sage-bg px-2.5 py-1 text-[12px] font-medium text-sage"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}

              <p className="m-0 font-serif text-[17px] leading-[26px] text-ink">
                {p.description}
              </p>

              {(p.retailers.length > 0 || saveState.productId) && (
                <div className="mt-auto flex items-center gap-3 pt-2">
                  {p.retailers.length > 0 && (
                    <a
                      href="#where-to-buy"
                      className="rounded-lg bg-primary px-4 py-2.5 text-[14px] font-semibold text-primary-foreground hover:opacity-90"
                    >
                      Where to buy ↓
                    </a>
                  )}
                  {saveState.productId && (
                    <SaveButton
                      productId={saveState.productId}
                      initialSaved={saveState.saved}
                      signedIn={saveState.signedIn}
                      unavailable={saveState.unavailable}
                    />
                  )}
                </div>
              )}
            </>
          }
        />

        {/* EVIDENCE BY CLAIM — full-width, one glanceable row per graded claim.
            Deterministic grades; the Gemini prose only narrates them. */}
        {evidenceClaims.length > 0 && (
          <div className="mt-10 border-t border-soft-tan pt-9">
            <h2 className="m-0 mb-6 font-mono text-[18px] font-bold uppercase tracking-[0.02em] text-ink">
              Evidence by claim
            </h2>
            <EvidenceByClaim claims={evidenceClaims} />
          </div>
        )}

        {/* RESEARCH — collapsed dropdown, sits below the evidence rollup and
            above Where to buy. A plus reveals the PubMed papers, a minus hides
            them. id="research" is the anchor the ingredient list's "read the
            research" link scrolls to. Renders nothing when there are no
            researched ingredients. */}
        <ResearchDropdown ingredients={researchIngredients} />

        {/* SAFETY */}
        {p.safety.length > 0 && (
          <div className="mt-10 border-t border-soft-tan pt-9">
            <h2 className="m-0 font-mono text-[18px] font-bold uppercase tracking-[0.02em] text-ink">
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

        {/* WHERE TO BUY — prices live here, per retailer, not in the summary.
            Always rendered so every profile has the section; falls back to an
            explicit "no stores yet" state rather than vanishing, so an empty
            catalogue reads as "we don't have a store link" not "this section
            doesn't exist". */}
        <div id="where-to-buy" className="mt-10 scroll-mt-24 border-t border-soft-tan pt-9">
          <div className="flex items-baseline gap-2.5">
            <h2 className="m-0 font-mono text-[18px] font-bold uppercase tracking-[0.02em] text-ink">
              Where to buy
            </h2>
            {p.retailerCount > 0 && (
              <span className="text-[13px] text-faint">from {p.retailerCount} retailers</span>
            )}
          </div>
          {p.retailers.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {p.retailers.map((r) => (
                <div
                  key={r.name}
                  className={
                    "flex items-center gap-3 rounded-xl border bg-white p-4 hover:bg-secondary " +
                    (r.highlight ? "border-primary" : "border-soft-tan hover:border-clay")
                  }
                >
                  <span
                    className="h-9 w-9 flex-shrink-0 rounded-full bg-cream"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="text-[15px] font-semibold text-ink">{r.name}</div>
                    <div className={"mt-0.5 text-sm " + (r.highlight ? "text-link" : "text-faint")}>
                      {r.price} →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-soft-tan bg-cream px-4 py-6 text-center text-[14px] text-faint">
              No stores yet
            </div>
          )}
        </div>

        {/* COMMUNITY */}
        {p.reviewCount > 0 && (
          <div className="mt-10 border-t border-soft-tan pt-9">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="m-0 font-mono text-[18px] font-bold uppercase tracking-[0.02em] text-ink">
                  From the community
                </h2>
                <div className="mt-0.5 text-[13px] text-faint">
                  Real reviews — sentiment only, doesn&apos;t change your match score.
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-serif text-[28px] font-semibold text-ink">{p.rating}</span>
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

        {/* MORE TO EXPLORE */}
        <div className="mt-10 border-t border-soft-tan pt-9">
          <div className="flex items-center justify-between">
            <h2 className="m-0 font-mono text-[18px] font-bold uppercase tracking-[0.02em] text-ink">
              More to explore
            </h2>
            <span aria-hidden="true" className="text-[20px] text-faint">→</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/product/${r.slug}`}
                className="rounded-xl border border-soft-tan bg-white p-5 hover:border-clay hover:bg-secondary"
              >
                <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-link">
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
