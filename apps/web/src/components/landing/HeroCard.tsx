import Link from "next/link";

/** The product-profile preview card shown beside the landing hero. */
export function HeroCard() {
  return (
    <div className="rounded-[20px] border border-border bg-warm-white p-6 shadow-[0_22px_60px_rgba(80,50,30,0.10)]">
      <p className="text-xs uppercase tracking-wider text-link">Inside a product profile</p>
      <h2 className="mt-4 font-serif text-2xl">Know what goes on your skin</h2>
      <ul className="mt-6 space-y-5 text-sm text-muted-foreground">
        <li><strong className="text-ink">Full INCI list</strong><br />Ingredients in their printed order.</li>
        <li><strong className="text-ink">Printed order</strong><br />See where each ingredient appears on the label.</li>
        <li><strong className="text-ink">Routine checks</strong><br />Check documented interactions between products you use.</li>
        <li><strong className="text-ink">Evidence where available</strong><br />Research is graded claim by claim; gaps stay visible.</li>
      </ul>
      <Link href="/search" className="mt-6 inline-block font-semibold text-link underline">Explore the catalogue →</Link>
    </div>
  );
}
