import type { Certainty } from "@skinsavior/core/research";

/**
 * Evidence strength as an ascending four-bar gauge (like signal strength): the
 * taller the lit run, the stronger the body of evidence. Bars fill left→right up
 * to `notches`. Colour encodes the grade so the weak end stays distinct — the
 * spec is explicit that "limited" and "very limited" must not collapse into one
 * grey bucket. Pure presentation, no hooks, safe in a server component.
 */

const BAR_HEIGHTS = ["h-2", "h-3", "h-4", "h-5"]; // ascending 8→20px

/** Lit-bar colour by grade. sage = well-supported, clay = thin, muted = barely. */
function fillClass(certainty: Certainty): string {
  switch (certainty) {
    case "strong":
    case "moderate":
      return "bg-sage";
    case "limited":
      return "bg-clay";
    case "very_limited":
      return "bg-muted-foreground";
  }
}

export function EvidenceMeter({
  certainty,
  notches,
  label,
  className,
}: {
  certainty: Certainty;
  notches: 1 | 2 | 3 | 4;
  /** Shown beside the bars; also used as the accessible name. */
  label: string;
  className?: string;
}) {
  const fill = fillClass(certainty);

  return (
    <div
      className={`flex items-center gap-2.5 ${className ?? ""}`}
      role="img"
      aria-label={`${label}, ${notches} of 4`}
    >
      <div className="flex items-end gap-[3px]" aria-hidden="true">
        {BAR_HEIGHTS.map((h, i) => (
          <span
            key={i}
            className={`w-1.5 rounded-sm ${h} ${i < notches ? fill : "bg-border"}`}
          />
        ))}
      </div>
      <span className="text-[13px] font-semibold text-ink">{label}</span>
    </div>
  );
}
