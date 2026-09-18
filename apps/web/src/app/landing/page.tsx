import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "skinsavior — Your skin, finally explained.",
  description:
    "Decode complete ingredient lists, inspect the evidence, and check the products in your routine for documented conflicts.",
};

function Nav() {
  return <SiteNav />;
}

function Hero() {
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

function HeroCard() {
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

function HookSection() {
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
      body: "Your answers seed a routine you can fill with products from the catalogue.",
    },
    {
      n: "3",
      title: "Check the full routine",
      body: "Deterministic rules flag documented conflicts and correct commonly feared combinations. Evidence grades stay separate.",
    },
  ];
  return (
    <section
      id="how"
      className="border-y border-border bg-warm-white px-6 py-20 md:px-14 md:py-24"
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-12 text-center">
          <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-link">
            How it works
          </div>
          <h2 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-[40px]">
            Three steps to knowing your skin
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background font-serif text-2xl font-semibold text-link">
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

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-14">
        <span className="font-serif text-lg font-semibold text-ink">skinsavior</span>
        <span className="text-[13px] text-muted-foreground">
          © {new Date().getFullYear()} · Independent &amp; unbiased · Not medical advice.
        </span>
      </div>
    </footer>
  );
}

export default async function LandingPage() {
  // Signed-in users going "home" should land on their personalized home, not
  // this logged-out marketing screen.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <HookSection />
        <HowItWorks />
        <CTASurvey />
      </main>
      <Footer />
    </div>
  );
}
