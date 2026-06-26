import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SearchBar } from "@/components/SearchBar";

export const metadata: Metadata = {
  title: "skinsavior — Your skin, finally explained.",
  description:
    "Answer a few questions about your skin. We'll match you with products backed by real research — and tell you exactly why each one is right for you.",
};

function Nav() {
  return <SiteNav />;
}

function Hero() {
  return (
    <section className="mx-auto flex max-w-[1180px] flex-col items-center px-6 pt-16 pb-16 md:px-14 md:pt-[76px] md:pb-16">
      <div className="flex w-full flex-col items-center text-center">
        <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-border bg-warm-white px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-sage" />
          <span className="text-[13px] font-medium text-muted-foreground">
            Personalized by AI · Backed by real science
          </span>
        </div>

        <h1 className="font-serif text-5xl font-medium leading-[1.02] tracking-tight text-ink text-balance md:text-[66px]">
          Your skin, finally explained.
        </h1>

        <div className="mt-8 flex w-full justify-center">
          <SearchBar />
        </div>

        <p className="mt-8 max-w-[520px] text-lg leading-[1.6] text-foreground/75 text-pretty">
          Answer a few questions about your skin. We&apos;ll match you with products backed
          by real research — and tell you exactly why each one is right for{" "}
          <em>you</em>.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
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

        <div className="mt-11 flex flex-wrap justify-center gap-x-10 gap-y-4 border-t border-border pt-8">
          {[
            { n: "240k+", l: "skin profiles matched" },
            { n: "31k+", l: "products decoded" },
            { n: "12k+", l: "research sources" },
          ].map((s) => (
            <div key={s.n}>
              <div className="font-serif text-3xl font-semibold text-ink">{s.n}</div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 w-full max-w-[420px] text-left">
        <HeroCard />
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="relative">
      <div className="rounded-[20px] border border-border bg-warm-white p-6 shadow-[0_22px_60px_rgba(80,50,30,0.10)]">
        <div className="flex items-start gap-4">
          <div
            className="flex h-[92px] w-[92px] flex-shrink-0 items-end rounded-xl p-2"
            style={{
              background:
                "repeating-linear-gradient(45deg,#e7ddcc 0 8px,#efe7d9 8px 16px)",
            }}
          >
            <span className="rounded bg-white/80 px-1.5 py-0.5 text-[9px] text-ink/40">
              img
            </span>
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-primary">
              COSRX
            </div>
            <div className="mt-1 font-serif text-[17px] font-medium leading-[1.25] text-ink">
              Advanced Snail 96
              <br />
              Mucin Essence
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5">
          <div className="flex h-[50px] w-[50px] flex-shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="font-serif text-base font-semibold leading-none">94%</span>
            <span className="text-[8px] tracking-wider opacity-85">MATCH</span>
          </div>
          <div>
            <div className="text-[13px] font-bold text-ink">
              Great match for your skin
            </div>
            <div className="text-xs text-muted-foreground">
              Personalized · Dry · Sensitive
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {["Pregnancy-safe", "Fragrance-free", "FA-safe"].map((t) => (
            <span
              key={t}
              className="rounded-full bg-sage-bg px-2.5 py-1 text-xs font-medium text-sage"
            >
              ✓ {t}
            </span>
          ))}
        </div>

        <div className="mt-3.5 flex items-center gap-2.5 border-t border-border pt-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary">
            <span className="font-serif text-sm font-semibold text-sage">B+</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Evidence grade · 6 human trials for hydration
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 right-5 whitespace-nowrap rounded-xl bg-ink px-4 py-2.5 text-[13px] font-semibold text-warm-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
        ♡ 4.7 · 12,480 reviews
      </div>
    </div>
  );
}

function HookSection() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-14 md:py-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
          The honest pitch
        </p>
        <h2 className="mt-6 font-serif text-4xl font-medium leading-[1.05] tracking-tight text-ink text-balance md:text-7xl">
          The beauty aisle lies.
          <br />
          <span className="italic text-primary">Your skin shouldn&apos;t have to guess.</span>
        </h2>
        <p className="mt-8 max-w-2xl font-serif text-xl leading-relaxed text-foreground/75 md:text-2xl">
          We read the studies, decode the INCI, and cross-check every claim — so the
          only thing left for you to do is shop like you mean it.
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "Tell us about your skin",
      body: "A few quick questions about your type, concerns, the products you use now, and what hasn't worked.",
    },
    {
      n: "2",
      title: "We build your profile",
      body: "Our AI scores 31,000+ products against your exact needs — weighing ingredients, evidence, and what already works for you.",
    },
    {
      n: "3",
      title: "See your matches",
      body: "Every product gets a personal match score. Evidence grades stay objective — community reviews are context, never the score.",
    },
  ];
  return (
    <section
      id="how"
      className="border-y border-border bg-warm-white px-6 py-20 md:px-14 md:py-24"
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-12 text-center">
          <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-primary">
            How it works
          </div>
          <h2 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-[40px]">
            Three steps to knowing your skin
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background font-serif text-2xl font-semibold text-primary">
                {s.n}
              </div>
              <h3 className="font-serif text-[22px] font-medium text-ink">{s.title}</h3>
              <p className="mt-2.5 text-[15px] leading-[1.6] text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="/quiz"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-9 py-4 text-base font-bold text-primary-foreground transition-colors hover:opacity-90"
          >
            Start the skin quiz →
          </a>
        </div>
      </div>
    </section>
  );
}

function ProductSnapshot() {
  return (
    <section id="product" className="bg-background">
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-14 md:py-32">
        <div className="mb-12 max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            Inside the app
          </p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl text-balance">
            One product. One brutally clear verdict.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A peek at a real product page in skinsavior — the same view you&apos;ll get for
            every bottle, tube, and jar on your shelf.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-warm-white shadow-[0_30px_80px_-40px_rgba(60,45,25,0.3)]">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="text-xs text-muted-foreground">
              Products / Essences / Hydrating
            </div>
            <div className="hidden gap-1 md:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
            </div>
          </div>

          <div className="grid gap-10 p-6 md:grid-cols-[340px_1fr] md:p-10">
            <div>
              <div
                className="relative aspect-square overflow-hidden rounded-2xl"
                style={{
                  background:
                    "repeating-linear-gradient(45deg,#e7ddcc 0 14px,#efe7d9 14px 28px)",
                }}
              >
                <span className="absolute bottom-4 left-4 rounded-md bg-warm-white/80 px-2 py-1 font-mono text-[11px] tracking-wider text-ink/60">
                  product shot
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-md"
                    style={{
                      background:
                        "repeating-linear-gradient(45deg,#e7ddcc 0 8px,#efe7d9 8px 16px)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="font-semibold uppercase tracking-[0.08em] text-primary">
                  COSRX
                </span>
                <span className="text-muted-foreground/60">·</span>
                <span className="text-muted-foreground">South Korea</span>
              </div>
              <h3 className="mt-2 font-serif text-3xl leading-[1.08] md:text-4xl">
                Advanced Snail 96
                <br /> Mucin Power Essence
              </h3>

              <div className="mt-5 flex items-center gap-3.5">
                <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <span className="font-serif text-2xl font-semibold leading-none">
                    94%
                  </span>
                  <span className="mt-1 text-[9px] uppercase tracking-[0.1em] opacity-85">
                    match
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-ink">Great match for your skin</div>
                  <div className="text-sm text-muted-foreground">
                    Personalized by skinsavior AI to{" "}
                    <strong>Dry · Sensitive · Fragrance-free</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "Cosmetic — not a drug",
                  "Pregnancy-safe",
                  "Fragrance-free",
                  "Fungal-acne safe",
                ].map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-sage-bg px-3 py-1.5 text-[13px] font-medium text-sage"
                  >
                    ✓ {t}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-[oklch(0.88_0.04_55)] bg-secondary/70 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary font-serif text-base font-semibold text-primary-foreground">
                      94%
                    </div>
                    <div>
                      <div className="text-sm font-bold text-ink">
                        For you · great match
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        skinsavior AI · from your profile
                      </div>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-[13px] text-sage">
                    <li>✓ Heavy humectant load for dehydration</li>
                    <li>✓ Fragrance-free — fits your sensitivity</li>
                    <li className="text-primary">⚠ Contains Phenoxyethanol</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-background p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-secondary font-serif text-lg font-semibold text-sage">
                      B+
                    </div>
                    <div>
                      <div className="text-sm font-bold text-ink">
                        Evidence &amp; efficacy
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        objective · same for everyone
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                    Hydration &amp; barrier repair well-supported by{" "}
                    <strong>6 human trials</strong>. Anti-aging claims rest on{" "}
                    <strong>14 lab studies</strong> — promising, not proven on skin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASurvey() {
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
            <em className="italic text-[oklch(0.82_0.09_55)]">We&apos;ll do the rest.</em>
          </h2>
          <p className="mt-6 max-w-lg text-lg text-warm-white/75">
            A few questions about your skin, your reactions, and what you want from
            your routine. You&apos;ll walk away with a personal match score on every
            product we track.
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

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-14">
        <span className="font-serif text-lg font-semibold text-ink">skinsavior</span>
        <span className="text-[13px] text-muted-foreground">
          © 2026 · Independent &amp; unbiased · Not medical advice.
        </span>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <HookSection />
        <HowItWorks />
        <ProductSnapshot />
        <CTASurvey />
      </main>
      <Footer />
    </div>
  );
}
