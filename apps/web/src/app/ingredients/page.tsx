import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { IngredientsExplorer } from "@/components/ingredients/IngredientsExplorer";
import { listIngredients } from "@/lib/ingredients-db";

export const metadata: Metadata = {
  title: "Ingredients",
  description:
    "Decode skincare ingredients. What they do, who they suit, and the research behind them.",
};

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const initialPage = await listIngredients({ q, offset: 0 });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-[1080px] px-6 py-12 md:px-12 md:py-16">
        <div className="mb-2 text-[13px] text-muted-foreground">Library / Ingredients</div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
          The ingredients library
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          What&apos;s actually in your skincare — {initialPage.total.toLocaleString()}{" "}
          ingredients drawn from the catalog. Filter by what they do, or search by name.
        </p>

        <IngredientsExplorer initialPage={initialPage} initialQ={q} />
      </main>
    </div>
  );
}
