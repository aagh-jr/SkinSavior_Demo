import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { ProductThumb } from "@/components/ProductThumb";
import { RoutineCard, NewRoutineCard } from "@/components/routines/RoutineCards";
import { createClient } from "@/lib/supabase/server";
import { listMyRoutines } from "@/lib/routines-db";
import { getProductsInUse, getSavedProducts, type ShelfProduct } from "@/lib/shelf-db";

export const metadata: Metadata = {
  title: "My shelf",
  description: "The products you use, the ones you're considering, and your routines.",
};

/**
 * Personal hub: everything that belongs to the user in one place.
 *
 * Replaces a standalone /routines nav entry and the old /saved page, which was
 * a mock over three demo products with no table behind it. Routines and
 * products were always the same story — what you own and how you use it — and
 * splitting them across two destinations meant neither felt like "mine".
 */
export default async function ShelfPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Same convention as /routines and /user: signed-out visitors go to the quiz.
  if (!user) redirect("/quiz");

  const [inUse, saved, routines] = await Promise.all([
    getProductsInUse(),
    getSavedProducts(),
    listMyRoutines(),
  ]);

  // A product can be both saved and in use; it belongs under "in use", which is
  // the stronger statement.
  const inUseIds = new Set(inUse.map((p) => p.productId));
  const savedOnly = saved.filter((p) => !inUseIds.has(p.productId));

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto w-full max-w-[1000px] px-6 py-12 md:px-12 md:py-16">
        <div className="mb-2 text-[13px] text-muted-foreground">My shelf</div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
          Your shelf
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
          What you use, what you&apos;re considering, and the routines they sit
          in.
        </p>

        {/* ---- In use ---- */}
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 font-serif text-[24px] font-medium text-ink">
              Products you use
            </h2>
            <span className="text-[13px] text-muted-foreground">
              {inUse.length > 0
                ? `${inUse.length} from your routines`
                : "from your routines"}
            </span>
          </div>

          {inUse.length === 0 ? (
            <EmptyNote>
              Nothing yet. Products appear here once you add them to a routine —
              that&apos;s also what lets us check them against each other for
              clashes.
            </EmptyNote>
          ) : (
            <ProductGrid products={inUse} />
          )}
        </section>

        {/* ---- Saved ---- */}
        <section className="mt-14">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 font-serif text-[24px] font-medium text-ink">Saved</h2>
            <span className="text-[13px] text-muted-foreground">
              {savedOnly.length > 0 ? `${savedOnly.length} to consider` : "to consider"}
            </span>
          </div>

          {savedOnly.length === 0 ? (
            <EmptyNote>
              Nothing saved. Tap <span className="font-semibold">Save to shelf</span>{" "}
              on any product to keep it here.
            </EmptyNote>
          ) : (
            <ProductGrid products={savedOnly} />
          )}
        </section>

        {/* ---- Routines ---- */}
        <section className="mt-14">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 font-serif text-[24px] font-medium text-ink">
              Your routines
            </h2>
            <span className="text-[13px] text-muted-foreground">
              {routines.length > 0 ? `${routines.length}` : "none yet"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {routines.map((routine) => (
              <RoutineCard key={routine.id} routine={routine} />
            ))}
            <NewRoutineCard />
          </div>
        </section>
      </main>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[14px] border border-dashed border-[#d8ccba] bg-warm-white p-6 text-[14px] leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

function ProductGrid({ products }: { products: ShelfProduct[] }) {
  return (
    <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const body = (
          <div className="flex h-full gap-4 rounded-[16px] border border-border bg-white p-4 transition-colors hover:border-clay">
            <div className="h-[70px] w-[70px] flex-shrink-0 overflow-hidden rounded-[12px] border border-border">
              <ProductThumb
                category={p.category}
                imageUrl={p.imageUrl}
                name={p.name}
                className="h-full w-full"
                iconSize={28}
                sizes="70px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-serif text-[15px] leading-snug text-ink">
                {p.name}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-clay">
                {p.brand}
              </p>
              {p.usedIn.length > 0 && (
                <p className="mt-1.5 line-clamp-1 text-[12px] text-muted-foreground">
                  in {p.usedIn.join(", ")}
                </p>
              )}
              {p.note && (
                <p className="mt-1.5 line-clamp-2 text-[12px] italic text-muted-foreground">
                  {p.note}
                </p>
              )}
            </div>
          </div>
        );
        return (
          <li key={p.productId}>
            {/* Ingested products always have a slug; guard anyway so a legacy
                row without one renders as a card rather than a broken link. */}
            {p.slug ? <Link href={`/product/${p.slug}`}>{body}</Link> : body}
          </li>
        );
      })}
    </ul>
  );
}
