import { HeroCard } from "@/components/landing/HeroCard";

/** Landing hero: headline, quiz CTA, stat row, and the preview card. */
export function Hero() {
  return (
    <section className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 px-6 pt-16 pb-16 md:grid-cols-[1.08fr_1fr] md:gap-[60px] md:px-14 md:pt-[76px] md:pb-16">
      <div>
        <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-border bg-warm-white px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-sage" />
          <span className="text-[13px] font-medium text-muted-foreground">
            Ingredient transparency · Evidence when available
          </span>
        </div>

        <h1 className="font-serif text-5xl font-medium leading-[1.02] tracking-tight text-ink md:text-[66px]">
          Your skin,
          <br />
          finally
          <br />
          explained.
        </h1>

        <p className="mt-6 max-w-[450px] text-lg leading-[1.6] text-foreground/75">
          See complete ingredient lists, build the routine you actually use, and check
          documented interactions without fearmongering.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-5">
          <a
            href="/quiz"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-bold text-primary-foreground transition-colors hover:opacity-90"
          >
            Take the skin quiz <span className="text-lg">→</span>
          </a>
          <span className="text-[13px] text-muted-foreground">
            ~5 minutes · No account needed to start
          </span>
        </div>

        <div className="mt-11 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-8">
          {[
            { n: "INCI", l: "full ingredient lists" },
            { n: "Routine", l: "interaction checks" },
            { n: "Evidence", l: "graded claim by claim" },
          ].map((s) => (
            <div key={s.n}>
              <div className="font-serif text-3xl font-semibold text-ink">{s.n}</div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <HeroCard />
    </section>
  );
}
