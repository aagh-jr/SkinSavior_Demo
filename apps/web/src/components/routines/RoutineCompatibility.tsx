import type { CompatibilityReport, EvidenceTier } from "@skinsavior/core/scoring";

/**
 * Clash and timing check for a routine.
 *
 * Two deliberate choices about tone:
 *
 * 1. Every finding shows its EVIDENCE TIER. The point of the product is that a
 *    user can tell documented pharmacology from folklore — a tier-A "acids
 *    raise UV sensitivity" and a tier-C "vitamin C and acids interact" should
 *    not look equally authoritative.
 *
 * 2. Wrongly-feared pairs get equal billing. "Niacinamide cancels vitamin C"
 *    is the most repeated non-clash in skincare; saying so plainly is as much
 *    the job as flagging real conflicts. A checker that only ever warns trains
 *    people to fear their own shelf.
 */

const TIER_LABEL: Record<EvidenceTier, string> = {
  A: "Consistent human trials",
  B: "Limited human evidence",
  C: "Mechanistic / lab evidence",
  D: "Widely repeated, thin evidence",
};

export function RoutineCompatibility({
  report,
}: {
  report: CompatibilityReport | null;
}) {
  // Nothing attached yet — an all-clear here would be a false reassurance.
  if (!report) {
    return (
      <section className="mt-10 rounded-[16px] border border-dashed border-[#d8ccba] bg-warm-white p-5">
        <h2 className="m-0 font-serif text-[20px] font-medium text-ink">
          Clash check
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Add the products you actually use and we&apos;ll check them against
          each other — ingredient conflicts, actives scheduled at the wrong time
          of day, and whether anything here needs sun protection you don&apos;t
          have.
        </p>
      </section>
    );
  }

  const { verdict, findings, reassurances } = report;
  const major = findings.filter((f) => f.severity === "major");

  const headline =
    verdict === "no_clashes"
      ? "Nothing here conflicts."
      : verdict === "major_clashes"
        ? `${major.length} thing${major.length === 1 ? "" : "s"} worth changing`
        : "A couple of small things";

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 font-serif text-[24px] font-medium text-ink">Clash check</h2>
        <span
          className="rounded-full px-3 py-1 text-[12px] font-semibold"
          style={
            verdict === "no_clashes"
              ? { background: "#f1f5ee", color: "#5a7a4a" }
              : verdict === "major_clashes"
                ? { background: "#fdf1ec", color: "#9a4a2f" }
                : { background: "#f8f5ef", color: "#7a6a58" }
          }
        >
          {headline}
        </span>
      </div>

      {findings.length === 0 && (
        <p className="rounded-[14px] border border-border bg-white p-5 text-[15px] leading-relaxed text-muted-foreground">
          Your routine&apos;s actives don&apos;t conflict, nothing is scheduled
          at a time that works against it, and anything sun-sensitising is
          covered by an SPF.
        </p>
      )}

      <ul className="list-none space-y-3 p-0">
        {findings.map((f) => {
          const isMajor = f.severity === "major";
          return (
            <li
              key={f.code + f.steps.join("|")}
              className="rounded-[14px] border bg-white p-5"
              style={{ borderColor: isMajor ? "#e5c4b6" : "#e6ddcf" }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={
                    isMajor
                      ? { background: "#fdf1ec", color: "#9a4a2f" }
                      : { background: "#f8f5ef", color: "#7a6a58" }
                  }
                >
                  {isMajor ? "Worth changing" : "Minor"}
                </span>
                <span
                  className="text-[11px] text-[#9a8c75]"
                  title={TIER_LABEL[f.evidenceTier]}
                >
                  Evidence {f.evidenceTier} · {TIER_LABEL[f.evidenceTier]}
                </span>
              </div>

              <h3 className="mt-2.5 font-serif text-[18px] font-medium leading-snug text-ink">
                {f.title}
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#3a3228]">
                {f.explanation}
              </p>
              <p className="mt-2.5 text-[14px] leading-relaxed text-ink">
                <span className="font-semibold">What to do: </span>
                {f.recommendation}
              </p>
              {f.ingredients.length > 0 && (
                <p className="mt-2 text-[12px] text-[#7a6a58]">
                  Because of: {f.ingredients.slice(0, 5).join(", ")}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {reassurances.length > 0 && (
        <div className="mt-4 space-y-3">
          {reassurances.map((r) => (
            <div
              key={r.code}
              className="rounded-[14px] border border-[#cfdcc6] bg-[#f1f5ee] p-5"
            >
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5a7a4a]">
                Commonly believed, not actually a problem
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[#3a3228]">{r.note}</p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-5 text-[12px] leading-relaxed text-muted-foreground">
        Checked against a curated set of documented ingredient interactions and
        usage rules — not generated by a model, and the same routine always
        gives the same result. Information to weigh, not medical advice.
      </p>
    </section>
  );
}
