/** "The honest pitch" band on the landing page. */
export function HookSection() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-14 md:py-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-link">
          The honest pitch
        </p>
        <h2 className="mt-6 font-serif text-4xl font-medium leading-[1.05] tracking-tight text-ink text-balance md:text-7xl">
          The beauty aisle lies.
          <br />
          <span className="italic text-link">Your skin shouldn&apos;t have to guess.</span>
        </h2>
        <p className="mt-8 max-w-2xl font-serif text-xl leading-relaxed text-foreground/75 md:text-2xl">
          We show complete INCI lists, add graded research where we have it, and
          keep the gaps visible so you can judge each claim for yourself.
        </p>
      </div>
    </section>
  );
}
