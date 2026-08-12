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
 * Categories to rank, in the order a routine is applied.
 *
 * Deliberately not every canonical category — eye_cream (2 products) and
 * face_oil (1) have nothing to rank, and a "top picks" row of one product
 * implies a selection that never happened. They come back when the catalog
 * can support them.
 */
const SECTIONS: { category: string; label: string }[] = [
  { category: "cleanser", label: "Cleansers" },
  { category: "toner", label: "Toners" },
  { category: "serum", label: "Serums" },
  { category: "moisturizer", label: "Moisturizers" },
  { category: "sunscreen", label: "Sunscreens" },
  { category: "exfoliant", label: "Exfoliants" },
  { category: "mask", label: "Masks" },
];

const PER_CATEGORY = 6;

export default async function ForYouPage() {
  const profile = await getMyProfile();

  // No profile: prompt rather than render a page of meaningless numbers.
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

  const sections = await Promise.all(
    SECTIONS.map(async (s) => ({
      ...s,
      data: await rankCategoryForMe(s.category, PER_CATEGORY),
    })),
  );

  const visible = sections.filter((s) => s.data && s.data.ranked.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto w-full max-w-[1100px] px-6 py-12 md:px-12 md:py-16">
        <div className="mb-2 text-[13px] text-muted-foreground">For you</div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
          Matched to your skin
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
          Every product scored against your quiz answers. Tap any product to see
          the full breakdown — which ingredients earned or cost it points, and
          why. Same answers, same score, every time.
        </p>

        {visible.length === 0 && (
          <p className="mt-10 text-muted-foreground">
            We couldn&apos;t rank anything yet — the catalogue is still filling out.
          </p>
        )}

        {visible.map(({ category, label, data }) => (
          <section key={category} className="mt-14">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="m-0 font-serif text-[26px] font-medium text-ink">{label}</h2>
              {/* Honest framing: with 7 exfoliants in the catalogue, "top 6"
                  would imply a selection that barely happened. Say what we
                  actually looked at. */}
              <span className="text-[13px] text-muted-foreground">
                {data!.total <= PER_CATEGORY
                  ? `all ${data!.total} we know about`
                  : `best ${data!.ranked.length} of ${data!.total}`}
                {data!.blockedCount > 0 && (
                  <> · {data!.blockedCount} hidden on safety grounds</>
                )}
              </span>
            </div>

            <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {data!.ranked.map(({ slug, name, brand, imageUrl, price, result }) => (
                <li key={slug}>
                  <Link
                    href={`/product/${slug}`}
                    className="flex h-full gap-4 rounded-[16px] border border-border bg-white p-4 transition-colors hover:border-clay"
                  >
                    <div className="h-[74px] w-[74px] flex-shrink-0 overflow-hidden rounded-[12px] border border-border">
                      <ProductThumb
                        category={category}
                        imageUrl={imageUrl}
                        name={name}
                        className="h-full w-full"
                        iconSize={30}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono text-[13px] font-semibold"
                          style={{
                            color:
                              result.score >= 80
                                ? "#5a7a4a"
                                : result.score >= 60
                                  ? "#7a6a58"
                                  : "#9a4a2f",
                          }}
                        >
                          {result.score}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                          match
                        </span>
                        {price && (
                          <span className="ml-auto text-[12px] text-muted-foreground">
                            {price}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 font-serif text-[15px] leading-snug text-ink">
                        {name}
                      </p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-clay">
                        {brand}
                      </p>
                      {/* The single biggest reason, so the card explains
                          itself without a click. */}
                      {result.reasons[0] && (
                        <p className="mt-1.5 line-clamp-1 text-[12px] text-muted-foreground">
                          {result.reasons[0].points > 0 ? "+" : ""}
                          {result.reasons[0].points}{" "}
                          {result.reasons[0].ingredients[0] ??
                            result.reasons[0].text}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-16 border-t border-border pt-6 text-[12px] leading-relaxed text-muted-foreground">
          Scores come from your quiz answers and each product&apos;s ingredient
          list — no AI guesswork, and the same inputs always give the same
          result. Products excluded on safety grounds are counted above but not
          shown here; you&apos;ll still see them, with the reason, if you reach
          them from search. This is information to weigh, not medical advice.
        </p>
      </main>
    </div>
  );
}
