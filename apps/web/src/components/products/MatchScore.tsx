import Link from "next/link";
import type { MatchResult } from "@skinsavior/core/scoring";

/**
 * "For your skin" panel: the match score with the arithmetic behind it.
 *
 * The whole premise of the product is transparency, so this never shows a bare
 * number. Every reason that moved the score is listed with its points and the
 * ingredients that triggered it — a user can check our work and disagree.
 *
 * Safety blocks render FIRST and unconditionally, above the score. They are
 * not a ranking signal: someone who reached this page from search or a shared
 * link still needs the warning, and a low rank they never saw is not a warning.
 */
export function MatchScore({ result }: { result: MatchResult | null }) {
  // No profile — prompt rather than invent a number for someone we know
  // nothing about.
  if (!result) {
    return (
      <section className="rounded-[18px] border border-dashed border-[#d8ccba] bg-warm-white p-6">
        <h2 className="m-0 font-serif text-[22px] font-medium text-[#1d1812]">
          How well does this suit your skin?
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Take the skin quiz and we&apos;ll score this product against your skin
          type, concerns, and anything you&apos;ve reacted to before — showing
          exactly how we got the number.
        </p>
        <Link
          href="/quiz"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[15px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Take the quiz →
        </Link>
      </section>
    );
  }

  const { score, blocked, blockReasons, reasons } = result;
  const tone = blocked
    ? { ring: "#9a4a2f", bg: "#fdf1ec" }
    : score >= 80
      ? { ring: "#5a7a4a", bg: "#f1f5ee" }
      : score >= 60
        ? { ring: "#9a8c75", bg: "#f8f5ef" }
        : { ring: "#9a4a2f", bg: "#fdf1ec" };

  return (
    <section className="rounded-[18px] border border-border bg-white p-6">
      {/* BLOCKED: one warning panel carrying every reason. Previously each
          reason rendered its own box with its own "NOT RECOMMENDED FOR YOU"
          heading, so a product failing two checks shouted the same headline
          twice. The heading is the verdict — it belongs once. */}
      {blocked ? (
        <div
          className="rounded-[14px] border border-[#e5c4b6] bg-[#fdf1ec] p-5"
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#9a4a2f] text-[15px] leading-none text-white"
            >
              ✕
            </span>
            <h2 className="m-0 font-serif text-[20px] font-medium text-[#9a4a2f]">
              Not recommended for you
            </h2>
          </div>

          <ul className="mt-3.5 list-none space-y-3.5 p-0">
            {blockReasons.map((r) => (
              <li key={r.code} className="border-l-2 border-[#e5c4b6] pl-3.5">
                <p className="m-0 text-[15px] leading-relaxed text-[#1d1812]">{r.text}</p>
                {r.ingredients.length > 0 && (
                  <p className="mt-1.5 text-[13px] text-[#7a6a58]">
                    Because of: {r.ingredients.join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* NOT BLOCKED: the score, with its headline. */
        <div className="flex items-start gap-5">
          <div
            className="flex h-[72px] w-[72px] flex-shrink-0 flex-col items-center justify-center rounded-full border-[3px]"
            style={{ borderColor: tone.ring, background: tone.bg }}
          >
            <span className="font-serif text-[26px] leading-none text-[#1d1812]">{score}</span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-[#7a6a58]">match</span>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="m-0 font-serif text-[22px] font-medium text-[#1d1812]">
              For your skin
            </h2>
            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
              {reasons.length === 0
                ? "Nothing in this formula speaks to the concerns you told us about, either way."
                : "Here's exactly what moved this score, and why."}
            </p>
          </div>
        </div>
      )}

      {reasons.length > 0 && (
        <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
          {/* Framed explicitly when blocked. Left unlabelled, a green "+18
              brightening" under a safety warning reads as the product arguing
              back. It IS worth showing — it tells the user what to look for in
              a safe alternative — but as context, not endorsement. */}
          {blocked && (
            <li className="mb-1 text-[13px] text-muted-foreground">
              What it would have matched, if it weren&apos;t for the above:
            </li>
          )}
          {reasons.map((r) => (
            <li key={r.code} className="flex items-start gap-3">
              <span
                className="mt-0.5 inline-flex h-6 min-w-[38px] flex-shrink-0 items-center justify-center rounded-full px-2 font-mono text-[12px] font-semibold"
                style={
                  blocked
                    ? { background: "#f3efe8", color: "#9a8c75" }
                    : r.direction === "up"
                      ? { background: "#f1f5ee", color: "#5a7a4a" }
                      : { background: "#fdf1ec", color: "#9a4a2f" }
                }
              >
                {r.points > 0 ? `+${r.points}` : r.points}
              </span>
              <span className="min-w-0 text-[14px] leading-relaxed text-[#1d1812]">
                {r.text}
                {r.ingredients.length > 0 && (
                  <span className="text-[#7a6a58]"> — {r.ingredients.join(", ")}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* The footnote has to match what's above it — claiming "the same
          answers always produce the same score" on a panel showing no score
          is the kind of small contradiction that makes the rest look careless. */}
      <p className="mt-5 border-t border-border pt-4 text-[12px] leading-relaxed text-[#7a6a58]">
        {blocked
          ? "Based on your quiz answers and this product's ingredient list, checked against documented ingredient guidance. Information to weigh, not medical advice — if you're unsure, ask your doctor."
          : "Scored from your quiz answers and this product's ingredient list. The same answers always produce the same score — no AI guesswork. This is information to weigh, not medical advice."}
      </p>
    </section>
  );
}
