import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { ProductsExplorer } from "@/components/products/ProductsExplorer";
import { listDbProductsPage, listProductCategories } from "@/lib/products-db";
import { scoreProductsForMe } from "@/lib/match-db";

export const metadata: Metadata = {
  title: "Search",
  description: "Search and browse skincare products by type, matched to your skin.",
};

/**
 * Never cached — the per-card match badge is a function of the viewer's quiz
 * profile, exactly like /for-you. A cached page would show one user's matches
 * to everyone.
 */
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const [categories, initialPage] = await Promise.all([
    listProductCategories(),
    listDbProductsPage({ q, offset: 0 }),
  ]);
  const initialScores = await scoreProductsForMe(
    initialPage.rows.map((r) => r.slug),
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <main className="mx-auto max-w-[1180px] px-6 py-9 md:px-14">
        <ProductsExplorer
          categories={categories}
          initialPage={initialPage}
          initialQ={q}
          initialScores={initialScores}
        />
      </main>
    </div>
  );
}
