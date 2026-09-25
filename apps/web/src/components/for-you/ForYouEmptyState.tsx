import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

/**
 * Shown on /for-you when the viewer has no scorable profile yet — prompts the
 * quiz rather than rendering meaningless numbers.
 */
export function ForYouEmptyState() {
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
