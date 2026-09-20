/** Three-step "how it works" section on the landing page. */
export function HowItWorks() {
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
