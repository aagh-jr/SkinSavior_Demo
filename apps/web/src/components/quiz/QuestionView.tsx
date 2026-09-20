import { useMemo } from "react";
import type { Step } from "@/components/quiz/survey.types";

/** Renders one quiz question (single or multi select) with next/back/skip. */
export function QuestionView({
  step,
  value,
  onChange,
  onNext,
  onBack,
  canBack,
  canContinue,
  isLast,
  onSkip,
}: {
  step: Step;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  onNext: () => void;
  onBack: () => void;
  canBack: boolean;
  canContinue: boolean;
  isLast: boolean;
  onSkip?: () => void;
}) {
  const multi = step.kind === "multi";
  const selected = useMemo(
    () => (multi ? (Array.isArray(value) ? value : []) : value),
    [value, multi],
  );

  function toggle(v: string) {
    if (!multi) {
      onChange(v);
      return;
    }
    const cur = Array.isArray(selected) ? selected : [];
    const has = cur.includes(v);
    const max = (step as Extract<Step, { kind: "multi" }>).max ?? 99;
    if (has) onChange(cur.filter((x) => x !== v));
    else if (cur.length < max) onChange([...cur, v]);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium leading-[1.15] tracking-tight text-ink md:text-[40px]">
        {step.title}
      </h1>
      {step.sub && (
        <p className="mt-3 text-[15px] text-muted-foreground">{step.sub}</p>
      )}

      <div className="mt-9 grid gap-3 md:grid-cols-2">
        {step.choices.map((c) => {
          const active = multi
            ? Array.isArray(selected) && selected.includes(c.value)
            : selected === c.value;
          return (
            <button
              aria-pressed={active}
              key={c.value}
              type="button"
              onClick={() => toggle(c.value)}
              className={[
                "flex items-center justify-between gap-3 rounded-xl border px-5 py-4 text-left transition-all",
                active
                  ? "border-primary bg-primary/5 shadow-[0_4px_14px_-6px_rgba(154,74,47,0.35)]"
                  : "border-border bg-warm-white hover:border-primary/40 hover:bg-secondary/40",
              ].join(" ")}
            >
              <span className="text-[15px] font-medium text-ink">{c.label}</span>
              <span
                className={[
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                ].join(" ")}
                aria-hidden
              >
                {active ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!canBack}
          className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-ink disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLast ? "See my results" : "Continue"} <span>→</span>
        </button>
      </div>

      {onSkip && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-[13px] text-muted-foreground underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Skip the survey for now
          </button>
        </div>
      )}
    </div>
  );
}
