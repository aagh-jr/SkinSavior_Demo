import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { ProductThumb } from "@/components/ProductThumb";
import {
  getDbProduct,
  getProductResearchIngredients,
  listRelatedDbProducts,
} from "@/lib/products-db";
import { listClaimsForIngredients } from "@/lib/claims-db";
import { brandSlug } from "@/lib/brands-db";
import { ProductProfileSplit } from "@/components/products/ProductProfileSplit";
import { EvidenceByClaim } from "@/components/products/EvidenceByClaim";
import { SaveButton } from "@/components/products/SaveButton";
import { getSaveStateBySlug } from "@/lib/shelf-db";
import { ResearchDropdown } from "@/components/research/ResearchDropdown";
import { getDemoProductEvidence } from "@/lib/demo-product-evidence";

/** Never cached because the page renders per-viewer save-to-shelf state. */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getDbProduct(slug);
  return { title: product ? product.name : "Product" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getDbProduct(slug);
  if (!product) notFound();

  const saveState = await getSaveStateBySlug(slug);
  const demoEvidence = getDemoProductEvidence(slug);
  const researchIngredients = demoEvidence?.researchIngredients ?? (await getProductResearchIngredients(slug));
  const claimsByIngredient = demoEvidence
    ? new Map()
    : await listClaimsForIngredients(researchIngredients.map((ingredient) => ingredient.ingredientId));
  const evidenceClaims = demoEvidence?.evidence ?? [...claimsByIngredient.values()]
    .flat()
    .sort((a, b) => b.notches - a.notches);
  const related = await listRelatedDbProducts(product.slug, product.category);
  const researchLabels = new Set(
    researchIngredients.map((ingredient) => ingredient.label.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background font-sans text-ink">
      <SiteNav />

      <main>
        <section className="mx-auto max-w-[1440px] px-6 py-8 md:px-14 lg:px-[76px] lg:pb-10">
          <div className="text-[11px] font-medium text-faint">
            <Link href="/search" className="rounded-sm hover:text-link hover:underline">
              {product.breadcrumb}
            </Link>
          </div>

          <div className="mt-6 grid items-center gap-8 md:grid-cols-[360px_minmax(0,1fr)] lg:gap-16">
            <ProductThumb
              category={product.category}
              imageUrl={product.imageUrl}
              name={product.name}
              className="h-[360px] w-full max-w-[360px] overflow-hidden rounded-xl border border-soft-tan bg-cream"
              iconSize={96}
            />

            <div className="flex min-w-0 flex-col items-start gap-4">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
                <Link
                  href={`/brands/${brandSlug(product.brand)}`}
                  className="rounded-sm hover:text-link hover:underline"
                >
                  {product.brand}
                </Link>
                {product.origin ? (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>{product.origin}</span>
                  </>
                ) : null}
              </div>

              <h1 className="m-0 max-w-[760px] text-balance font-serif text-[38px] font-medium leading-[1.05] text-ink md:text-[42px]">
                {product.name}
              </h1>

              {product.badges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {product.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-md bg-sage-bg px-2.5 py-1.5 text-[11px] font-semibold uppercase text-sage"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}

              {evidenceClaims.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {evidenceClaims.slice(0, 3).map((claim) => (
                    <span
                      key={claim.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-soft-tan bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink"
                    >
                      <span
                        aria-hidden="true"
                        className={
                          "h-1.5 w-1.5 rounded-full " +
                          (claim.notches >= 3 ? "bg-sage" : "bg-soft-tan")
                        }
                      />
                      {claim.badgeLabel}
                    </span>
                  ))}
                </div>
              ) : null}

              <p className="m-0 max-w-[760px] font-serif text-[18px] leading-[1.45] text-ink">
                {product.description ||
                  "A product profile built around the label: see every ingredient in order, then inspect what appears in the formula."}
              </p>

              <div className="flex flex-wrap items-start gap-3 pt-1">
                <Link
                  href="/routines"
                  className="inline-flex rounded-lg border border-soft-tan bg-white px-4 py-2.5 text-[13px] font-semibold text-ink outline-none hover:border-primary hover:bg-cream focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Add to routine
                </Link>
                {saveState.productId ? (
                  <SaveButton
                    productId={saveState.productId}
                    initialSaved={saveState.saved}
                    signedIn={saveState.signedIn}
                    unavailable={saveState.unavailable}
                    unsavedLabel="Add to wishlist"
                    savedLabel="On wishlist"
                  />
                ) : (
                  <Link
                    href={saveState.signedIn ? "/shelf" : "/login"}
                    className="inline-flex rounded-lg border border-soft-tan bg-white px-4 py-2.5 text-[13px] font-semibold text-ink outline-none hover:border-primary hover:bg-cream focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Add to wishlist
                  </Link>
                )}
                <a
                  href="#where-to-buy"
                  className="inline-flex rounded-lg bg-ink px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm outline-none transition-[transform,background-color,box-shadow] duration-200 ease-out hover:bg-link hover:shadow-md active:scale-[0.98] active:bg-primary active:shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
                >
                  Where to buy
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-soft-tan">
          <div className="mx-auto max-w-[1440px] px-6 py-10 md:px-14 lg:min-h-[1024px] lg:px-[76px] lg:pb-20">
            <ProductProfileSplit
              ingredients={product.ingredients}
              researchLabels={researchLabels}
              evidenceSlot={
                evidenceClaims.length > 0 ? (
                  <section aria-labelledby="evidence-heading">
                    <h2
                      id="evidence-heading"
                      className="m-0 mb-4 font-mono text-[14px] font-bold uppercase tracking-[0.07em] text-ink"
                    >
                      Evidence by claim
                    </h2>
                    <EvidenceByClaim claims={evidenceClaims} />
                  </section>
                ) : null
              }
              researchSlot={
                <ResearchDropdown ingredients={researchIngredients} papers={demoEvidence?.papers} />
              }
            />
          </div>
        </section>

        <section id="where-to-buy" className="scroll-mt-24 border-t border-soft-tan bg-white">
          <div className="mx-auto max-w-[1440px] px-6 py-8 md:px-14 lg:px-[76px] lg:pb-[52px]">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h2 className="m-0 font-mono text-[18px] font-bold uppercase tracking-[0.02em] text-ink">
                Where to buy
              </h2>
              {product.retailerCount > 0 ? (
                <span className="text-[13px] text-faint">
                  from {product.retailerCount} retailers
                </span>
              ) : null}
            </div>

            {product.retailers.length > 0 ? (
              <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
                {product.retailers.map((retailer) => (
                  <div
                    key={retailer.name}
                    className={
                      "rounded-[10px] border bg-white p-[18px] transition-colors hover:bg-cream " +
                      (retailer.highlight
                        ? "border-primary"
                        : "border-soft-tan hover:border-primary")
                    }
                  >
                    <div className="text-[15px] font-semibold text-ink">{retailer.name}</div>
                    <div className="mt-2 text-[14px] text-link">{retailer.price || "$—"} →</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-[10px] border border-dashed border-soft-tan bg-cream px-5 py-6 text-center text-[14px] text-faint">
                No stores yet
              </div>
            )}
          </div>
        </section>

        <section className="bg-cream">
          <div className="mx-auto max-w-[1440px] px-6 pb-[72px] pt-8 md:px-14 lg:px-[76px]">
            <div className="flex items-center justify-between">
              <h2 className="m-0 font-mono text-[18px] font-bold uppercase tracking-[0.02em] text-ink">
                More to explore
              </h2>
              <span aria-hidden="true" className="text-[20px] text-faint">
                →
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/product/${item.slug}`}
                  className="group overflow-hidden rounded-[10px] border border-soft-tan bg-white outline-none transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ProductThumb
                    category={item.category}
                    imageUrl={item.imageUrl}
                    name={item.name}
                    className="h-[200px] w-full bg-cream"
                    iconSize={56}
                  />
                  <div className="p-[18px]">
                    <div className="font-mono text-[10px] font-medium uppercase tracking-wider text-faint group-hover:text-link">
                      {item.brand}
                    </div>
                    <div className="mt-1 font-serif text-[18px] font-medium leading-snug text-ink">
                      {item.name}
                    </div>
                    <div className="mt-1 text-[12px] text-faint">{item.tagline}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
