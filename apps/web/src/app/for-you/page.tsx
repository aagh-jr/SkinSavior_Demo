import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { ProductThumb } from "@/components/ProductThumb";
import { getMyProfile, isScorable, rankCategoryForMe } from "@/lib/match-db";

export const metadata: Metadata = {
  title: "For you",
  description:
    "Products ranked against your skin profile, with the reasoning behind every score.",
};

/**
 * Never cached.
 *
 * The ranking is a function of the viewer's quiz profile AND the live
 * ingredient data, so a cached render is wrong for the next visitor and goes
 * stale the moment either changes. That is not cosmetic: a cached page served
 * a product at rank 3 with a 97 that, recomputed, scored 96 and was BLOCKED
 * twice — for lactic acid against a declared isotretinoin course and for
 * flagged essential oils. A safety exclusion that a cache can hide is not an
 * exclusion.
 */
export const dynamic = "force-dynamic";

/**
 * Selectable categories, in the order a routine is applied.
 *
 * Deliberately not every canonical category — eye_cream (2 products) and
 * face_oil (1) have nothing to rank, and a "ranking" of one product implies a
 * selection that never happened. They return when the catalogue can support
 * them.
 */
const CATEGORIES = [
  { key: "cleanser", label: "Cleansers" },
  { key: "toner", label: "Toners" },
  { key: "serum", label: "Serums" },
  { key: "moisturizer", label: "Moisturizers" },
  { key: "sunscreen", label: "Sunscreens" },
  { key: "exfoliant", label: "Exfoliants" },
  { key: "mask", label: "Masks" },
] as const;

const LIMIT = 20;

/**
 * Score colour band.
 *
 * Four clearly separated steps rather than a wash of warm neutrals — the whole
 * point of a score is that you can tell a good match from a mediocre one at a
 * glance, which a single brown-ish tone can't do.
 */
function band(score: number) {
  if (score >= 85) return { fg: "#2f6b30", bg: "#e4f2df", ring: "#7fb069" };
  if (score >= 70) return { fg: "#4a7c2f", bg: "#eef5e6", ring: "#a3c585" };
  if (score >= 55) return { fg: "#9a6a12", bg: "#fdf2dd", ring: "#e0be7a" };
  return { fg: "#9a4a2f", bg: "#fdece6", ring: "#dda893" };
}

export default async function ForYouPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const profile = await getMyProfile();

  // No profile: prompt rather than render meaningless numbers.
  if (!isScorable(profile)) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <main className="mx-auto w-full max-w-[860px] px-6 py-16 md:px-12 md:py-24">
          <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
            Nothing to rank yet.
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
            Once you&apos;ve told us about your skin, we&apos;ll score every
            product in the catalogue against it — and show exactly how each
            score was reached, ingredient by ingredient.
          </p>
          <Link
            href="/quiz"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Take the skin quiz →
          </Link>
        </main>
      </div>
    );
  }

  const active =
    CATEGORIES.find((c) => c.key === category)?.key ?? CATEGORIES[2].key; // serums
  const activeLabel = CATEGORIES.find((c) => c.key === active)!.label;
  const data = await rankCategoryForMe(active, LIMIT);
  const ranked = data?.ranked ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto w-full max-w-[900px] px-6 py-10 md:px-12 md:py-14">
        <div className="mb-2 text-[13px] text-muted-foreground">For you</div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
          Matched to your skin
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
          Every product scored against your quiz answers, best first. Tap any
          one to see the full breakdown — which ingredients earned or cost it
          points, and why.
        </p>

        {/* Category selector — server-side links, so no client JS needed. */}
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const isActive = c.key === active;
            return (
              <Link
                key={c.key}
                href={`/for-you?category=${c.key}`}
                scroll={false}
                className={
                  "rounded-full border px-4 py-2 text-[14px] font-medium transition-colors " +
                  (isActive
                    ? "border-ink bg-ink text-warm-white"
                    : "border-border bg-warm-white text-ink hover:border-clay")
                }
              >
                {c.label}
              </Link>
            );
          })}
        </div>

        {/* Honest framing: with 7 exfoliants, "top 20" would imply a selection
            that barely happened. Say what we actually looked at. */}
        <p className="mt-6 text-[13px] text-muted-foreground">
          {data && data.total > 0 ? (
            <>
              {data.total <= LIMIT
                ? `All ${data.total} ${activeLabel.toLowerCase()} we know about`
                : `Best ${ranked.length} of ${data.total} ${activeLabel.toLowerCase()}`}
              {data.blockedCount > 0 && (
                <> · {data.blockedCount} hidden on safety grounds</>
              )}
            </>
          ) : (
            <>No {activeLabel.toLowerCase()} in the catalogue yet.</>
          )}
        </p>

        <ol className="mt-5 list-none space-y-3 p-0">
          {ranked.map(({ slug, name, brand, imageUrl, price, result }, i) => {
            const c = band(result.score);
            const top = result.reasons[0];
            return (
              <li key={slug}>
                <Link
                  href={`/product/${slug}`}
                  className="flex items-center gap-4 rounded-[16px] border border-border bg-white p-4 transition-colors hover:border-clay"
                >
                  <span className="w-5 flex-shrink-0 text-center font-mono text-[13px] text-[#9a8c75]">
                    {i + 1}
                  </span>

                  <div className="h-[68px] w-[68px] flex-shrink-0 overflow-hidden rounded-[12px] border border-border">
                    <ProductThumb
                      category={active}
                      imageUrl={imageUrl}
                      name={name}
                      className="h-full w-full"
                      iconSize={28}
                    />
                  </div>

                  {/* Big, clearly banded score — readable at a glance. */}
                  <div
                    className="flex h-[58px] w-[58px] flex-shrink-0 flex-col items-center justify-center rounded-[14px] border-2"
                    style={{ background: c.bg, borderColor: c.ring }}
                  >
                    <span
                      className="font-serif text-[24px] font-semibold leading-none"
                      style={{ color: c.fg }}
                    >
                      {result.score}
                    </span>
                    <span
                      className="mt-0.5 text-[9px] uppercase tracking-[0.12em]"
                      style={{ color: c.fg, opacity: 0.75 }}
                    >
                      match
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-serif text-[16px] leading-snug text-ink">
                      {name}
                    </p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-clay">
                      {brand}
                      {price && <span className="ml-2 normal-case tracking-normal text-muted-foreground">{price}</span>}
                    </p>
                    {top && (
                      <p className="mt-1.5 line-clamp-1 text-[12px]">
                        <span
                          className="font-mono font-semibold"
                          style={{ color: top.points > 0 ? "#2f6b30" : "#9a4a2f" }}
                        >
                          {top.points > 0 ? "+" : ""}
                          {top.points}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {top.ingredients[0] ?? top.text}
                        </span>
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>

        {ranked.length === 0 && data && data.total === 0 && (
          <p className="mt-6 rounded-[14px] border border-dashed border-border bg-warm-white p-6 text-center text-[14px] text-muted-foreground">
            Nothing here yet — the catalogue is still filling out for this type.
          </p>
        )}

        <p className="mt-12 border-t border-border pt-6 text-[12px] leading-relaxed text-muted-foreground">
          Scores come from your quiz answers and each product&apos;s ingredient
          list — no AI guesswork, and the same inputs always give the same
          result. Products excluded on safety grounds are counted above but not
          listed; you&apos;ll still see them, with the reason, if you reach them
          from search. This is information to weigh, not medical advice.
        </p>
      </main>
    </div>
  );
}
