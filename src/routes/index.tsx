import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "skinsavior — Know what's actually in your skincare" },
      {
        name: "description",
        content:
          "AI-powered transparency for every bottle on your shelf. Decode ingredients, score safety, and find products matched to your skin.",
      },
      { property: "og:title", content: "skinsavior — Know what's actually in your skincare" },
      {
        property: "og:description",
        content:
          "AI-powered transparency for every bottle on your shelf. Decode ingredients, score safety, and find products matched to your skin.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Hanken+Grotesk:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: Landing,
});

function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4 md:px-12 md:py-5">
        <div className="flex items-center gap-8">
          <span className="font-serif text-2xl font-semibold tracking-tight text-ink">
            skinsavior
          </span>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#product" className="hover:text-ink">Inside the app</a>
            <a href="#science" className="hover:text-ink">Our science</a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="#survey"
            className="hidden text-sm text-muted-foreground hover:text-ink md:inline"
          >
            Sign in
          </a>
          <a
            href="#survey"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            Take the quiz
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 pt-14 pb-24 md:px-12 md:pt-24 md:pb-32">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-warm-white px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              AI skincare transparency
            </span>
          </div>

          <h1 className="font-serif text-5xl leading-[1.02] tracking-tight text-ink md:text-7xl">
            Know what's <em className="italic text-primary">actually</em> in
            <br /> your skincare.
          </h1>

          <p className="mt-7 max-w-xl font-serif text-xl leading-relaxed text-foreground/80 md:text-2xl">
            skinsavior decodes every ingredient, weighs the evidence, and tells you
            — honestly — whether a product belongs on <em>your</em> face.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#survey"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Take the 2-minute skin quiz
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
            <a
              href="#product"
              className="inline-flex items-center gap-2 rounded-xl border border-accent px-6 py-3.5 text-base font-semibold text-primary hover:bg-warm-white"
            >
              See a product breakdown
            </a>
          </div>

          <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              <div className="h-7 w-7 rounded-full border-2 border-background bg-accent" />
              <div className="h-7 w-7 rounded-full border-2 border-background bg-primary" />
              <div className="h-7 w-7 rounded-full border-2 border-background bg-sage" />
            </div>
            <span>
              <strong className="text-ink">38,000+</strong> shelves decoded this month
            </span>
          </div>
        </div>

        <div className="relative md:col-span-5">
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-3xl bg-secondary/60 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-warm-white shadow-[0_30px_60px_-30px_rgba(60,45,25,0.25)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary/70" />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              live match
            </span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            skinsavior.ai
          </span>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden bg-[repeating-linear-gradient(45deg,#e7ddcc_0_14px,#efe7d9_14px_28px)]">
          <div className="absolute inset-0 flex items-end p-4">
            <span className="font-mono text-[11px] tracking-wider text-ink/60">
              advanced snail 96 — essence
            </span>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="font-serif text-xl font-semibold leading-none">94%</span>
              <span className="mt-0.5 text-[8px] uppercase tracking-[0.12em] opacity-85">
                match
              </span>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">Great match for your skin</div>
              <div className="text-xs text-muted-foreground">
                Personalized for <strong>Dry · Sensitive · Fragrance-free</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["Fragrance-free", "Pregnancy-safe", "Fungal-acne safe"].map((t) => (
              <span
                key={t}
                className="rounded-full bg-sage-bg px-2.5 py-1 text-[11px] font-medium text-sage"
              >
                ✓ {t}
              </span>
            ))}
          </div>

          <div className="space-y-1 border-t border-border pt-3 text-[13px]">
            <Row label="Snail Secretion Filtrate" tag="Key active" tone="sage" />
            <Row label="Sodium Hyaluronate" tag="Humectant" />
            <Row label="Phenoxyethanol" tag="⚠ Sensitive skin" tone="warn" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  tag,
  tone,
}: {
  label: string;
  tag: string;
  tone?: "sage" | "warn";
}) {
  const toneClass =
    tone === "sage"
      ? "bg-sage-bg text-sage"
      : tone === "warn"
        ? "bg-[oklch(0.94_0.04_55)] text-primary"
        : "bg-secondary text-muted-foreground";
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-ink">{label}</span>
      <span className={`rounded-md px-2 py-0.5 text-[11px] ${toneClass}`}>{tag}</span>
    </div>
  );
}

function HookSection() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-12 md:py-36">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
          The honest pitch
        </p>
        <h2 className="mt-6 font-serif text-4xl font-medium leading-[1.05] tracking-tight text-ink text-balance md:text-7xl">
          The beauty aisle lies.
          <br />
          <span className="text-primary italic">Your skin shouldn't have to guess.</span>
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
      n: "01",
      title: "Tell us your skin",
      body: "A 2-minute survey covers your type, sensitivities, goals, and the ingredients you've reacted to.",
    },
    {
      n: "02",
      title: "We build your profile",
      body: "Our AI weights your concerns against thousands of peer-reviewed studies and clinical trials.",
    },
    {
      n: "03",
      title: "Shop with receipts",
      body: "Every product gets a personal match score, an evidence grade, and a plain-English breakdown.",
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-[1180px] px-6 py-24 md:px-12 md:py-32">
      <div className="mb-14 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            How it works
          </p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">
            Built around your skin, not a marketing deck.
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="bg-warm-white p-8 md:p-10">
            <span className="font-mono text-xs tracking-widest text-primary">{s.n}</span>
            <h3 className="mt-5 font-serif text-2xl">{s.title}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductSnapshot() {
  return (
    <section id="product" className="bg-warm-white border-y border-border">
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-12 md:py-32">
        <div className="mb-12 max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            Inside the app
          </p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl text-balance">
            One product. One brutally clear verdict.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A peek at a real product page in skinsavior — the same view you'll get for
            every bottle, tube, and jar on your shelf.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_30px_80px_-40px_rgba(60,45,25,0.3)]">
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
                <div className="rounded-xl border border-border bg-warm-white p-5">
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

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Real product page from skinsavior — your shelf, decoded the same way.
        </p>
      </div>
    </section>
  );
}

function CTASurvey() {
  return (
    <section id="survey" className="mx-auto max-w-[1180px] px-6 py-24 md:px-12 md:py-36">
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
            Take the 2-minute survey.
            <br />
            <em className="italic text-[oklch(0.82_0.09_55)]">
              We'll do the rest.
            </em>
          </h2>
          <p className="mt-6 max-w-lg text-lg text-warm-white/75">
            Twelve questions about your skin, your reactions, and what you want from
            your routine. You'll walk away with a personal match score on every
            product we track.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#survey"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Start my skin survey
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
            <span className="text-sm text-warm-white/60">
              Free · no email required to start
            </span>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-warm-white/15 pt-8 text-sm text-warm-white/70">
            <div>
              <div className="font-serif text-2xl text-warm-white">2 min</div>
              <div className="mt-1">Average time</div>
            </div>
            <div>
              <div className="font-serif text-2xl text-warm-white">12 q's</div>
              <div className="mt-1">Skin, goals, reactions</div>
            </div>
            <div>
              <div className="font-serif text-2xl text-warm-white">∞</div>
              <div className="mt-1">Products scored for you</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-12">
        <div>
          <div className="font-serif text-xl font-semibold text-ink">skinsavior</div>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-powered transparency for what you put on your skin.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a className="hover:text-ink" href="#">Privacy</a>
          <a className="hover:text-ink" href="#">Sources</a>
          <a className="hover:text-ink" href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
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
