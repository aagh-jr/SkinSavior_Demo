/** Closing call-to-action band that points to the skin quiz. */
export function CTASurvey() {
  return (
    <section id="survey" className="mx-auto max-w-[1180px] px-6 py-20 md:px-14 md:py-28">
      <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-warm-white md:p-20">
        <div
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={{ background: "oklch(0.6 0.16 38)" }}
          aria-hidden
        />
        <div className="relative max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-warm-white/60">
            Start with your skin
          </p>
          <h2 className="mt-5 font-serif text-4xl leading-[1.05] text-warm-white md:text-6xl">
            Take the skin quiz.
            <br />
            <em className="italic text-[oklch(0.82_0.09_55)]">
              We&apos;ll build your starting point.
            </em>
          </h2>
          <p className="mt-6 max-w-lg text-lg text-warm-white/75">
            A few questions about your skin, your reactions, and what you use now.
            We&apos;ll turn those answers into a routine you can complete and check.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="/quiz"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-bold text-primary-foreground transition-colors hover:opacity-90"
            >
              Start my skin quiz <span>→</span>
            </a>
            <span className="text-sm text-warm-white/60">
              ~5 minutes · no account needed to start
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
