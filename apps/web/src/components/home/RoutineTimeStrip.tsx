"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductThumb } from "@/components/ProductThumb";
import type { BuilderStep } from "@/lib/routines-db";

/** A single step's product photo — the large 130×160 tile from the redesign.
 *  Deliberately just the photo: at this size a name label would either
 *  truncate illegibly or force the tile taller than the design calls for,
 *  and the product is already one tap away. */
function StepTile({ step }: { step: BuilderStep }) {
  const className =
    "h-40 w-[130px] flex-shrink-0 overflow-hidden rounded-[25px] border border-soft-tan bg-cream transition-colors hover:border-clay";
  const thumb = (
    <ProductThumb
      category={step.category}
      imageUrl={step.productImage}
      name={step.productName}
      className="h-full w-full"
      iconSize={28}
    />
  );
  return step.productSlug ? (
    <Link
      href={`/product/${step.productSlug}`}
      className={className}
      aria-label={step.productName}
      title={step.productName}
    >
      {thumb}
    </Link>
  ) : (
    <div className={className} title={step.productName}>
      {thumb}
    </div>
  );
}

/**
 * AM/PM toggle for the home routine strip. A routine's steps can each be
 * scoped to "am", "pm", or "both" — this shows only the steps that apply to
 * whichever time of day is selected, not the whole routine at once.
 */
export function RoutineTimeStrip({
  amSteps,
  pmSteps,
  routineId,
}: {
  amSteps: BuilderStep[];
  pmSteps: BuilderStep[];
  routineId: string;
}) {
  const [time, setTime] = useState<"am" | "pm">("pm");
  const activeSteps = time === "pm" ? pmSteps : amSteps;

  return (
    <div className="flex items-center gap-5 overflow-x-auto border-t border-soft-tan px-5 py-3.5">
      <div className="flex w-[74px] flex-shrink-0 flex-col gap-1">
        <button
          type="button"
          onClick={() => setTime("pm")}
          aria-pressed={time === "pm"}
          className="text-left"
        >
          <span
            className={
              "font-mono text-4xl font-semibold tracking-[0.12em] transition-colors " +
              (time === "pm" ? "text-ink" : "text-ink/50")
            }
          >
            PM
          </span>
        </button>
        <span className="text-xs text-faint">
          {pmSteps.length} {pmSteps.length === 1 ? "step" : "steps"}
        </span>
        <button
          type="button"
          onClick={() => setTime("am")}
          aria-pressed={time === "am"}
          className="text-left"
        >
          <span
            className={
              "font-mono text-4xl font-semibold tracking-[0.12em] transition-colors " +
              (time === "am" ? "text-ink" : "text-ink/50")
            }
          >
            AM
          </span>
        </button>
        <span className="text-xs text-faint">
          {amSteps.length} {amSteps.length === 1 ? "step" : "steps"}
        </span>
      </div>
      {activeSteps.length === 0 ? (
        <div className="flex h-40 flex-1 items-center text-[13px] text-faint">
          No {time.toUpperCase()} steps in this routine yet.
        </div>
      ) : (
        activeSteps.map((s) => <StepTile key={s.id} step={s} />)
      )}
      <Link
        href={`/routines/${routineId}`}
        aria-label="Add a step"
        title="Add a step"
        className="flex h-40 w-[130px] flex-shrink-0 items-center justify-center rounded-[25px] border border-dashed border-soft-tan bg-cream text-[13px] font-semibold text-link transition-colors hover:bg-secondary"
      >
        + Add
      </Link>
    </div>
  );
}
