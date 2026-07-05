"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createRoutineAction,
  deleteRoutineAction,
  setPrimaryRoutineAction,
} from "@/app/routines/actions";
import type { RoutineSummary } from "@/lib/routines-db";

const cardBase =
  "group relative flex min-h-[150px] flex-col justify-between rounded-2xl border p-6 text-left transition-colors";

/** A single saved routine — links to its builder, with a hover delete. */
export function RoutineCard({ routine }: { routine: RoutineSummary }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);

  function stop(e: React.MouseEvent) {
    // The card is a Link; don't navigate when an inline control is used.
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDelete(e: React.MouseEvent) {
    stop(e);
    if (!confirm(`Delete "${routine.name}"? This can't be undone.`)) return;
    startTransition(async () => {
      const res = await deleteRoutineAction(routine.id);
      if (res.ok) router.refresh();
    });
  }

  function handleSetPrimary(e: React.MouseEvent) {
    stop(e);
    setError(null);
    startTransition(async () => {
      const res = await setPrimaryRoutineAction(routine.id);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <Link
      href={`/routines/${routine.id}`}
      className={`${cardBase} bg-card shadow-sm hover:border-clay ${
        routine.isPrimary ? "border-clay" : "border-border"
      } ${pending ? "pointer-events-none opacity-50" : ""}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="truncate font-serif text-xl font-semibold text-ink">
            {routine.name}
          </h2>
          {routine.isPrimary ? (
            <span className="flex-shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-clay">
              ★ Primary
            </span>
          ) : null}
        </div>
        {routine.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {routine.description}
          </p>
        ) : null}
        <p className="mt-1 text-[13px] text-muted-foreground">
          {routine.stepCount} {routine.stepCount === 1 ? "step" : "steps"}
        </p>
        {error ? (
          <p className="mt-1 text-[12px] text-destructive">{error}</p>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-clay">Open →</span>
        <div className="flex items-center gap-1">
          {routine.isPrimary ? null : (
            <button
              type="button"
              onClick={handleSetPrimary}
              className="rounded-full px-2 py-1 text-[12px] font-semibold text-muted-foreground opacity-0 transition-opacity hover:text-clay focus:opacity-100 group-hover:opacity-100"
            >
              Set primary
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            aria-label={`Delete ${routine.name}`}
            className="rounded-full px-2 py-1 text-[12px] text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus:opacity-100 group-hover:opacity-100"
          >
            Delete
          </button>
        </div>
      </div>
    </Link>
  );
}

/** The "+ New routine" tile — creates a routine and opens its builder. */
export function NewRoutineCard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const res = await createRoutineAction();
      if (res.ok) router.push(`/routines/${res.id}`);
      else setError(res.error);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCreate}
      disabled={pending}
      className={`${cardBase} items-center justify-center border-2 border-dashed border-border text-muted-foreground hover:border-clay hover:text-clay disabled:opacity-60`}
    >
      <div className="flex flex-col items-center gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-current text-2xl leading-none">
          +
        </span>
        <span className="text-[15px] font-semibold">
          {pending ? "Creating…" : "New routine"}
        </span>
        {error && <span className="text-[12px] text-destructive">{error}</span>}
      </div>
    </button>
  );
}
