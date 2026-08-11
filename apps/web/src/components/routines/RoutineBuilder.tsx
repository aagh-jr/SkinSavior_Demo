"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  DAY_LABELS,
  ROUTINE_CATEGORIES,
  ROUTINE_FREQUENCIES,
  type RoutineCategory,
  type RoutineFrequency,
  type TimeOfDay,
} from "@/lib/routine-categories";
import type { BuilderStep, StepPatch } from "@/lib/routines-db";
import { ProductThumb } from "@/components/ProductThumb";
import {
  addStepAction,
  setStepProductAction,
  deleteStepAction,
  reorderStepsAction,
  updateRoutineAction,
  updateStepAction,
  type ActionResult,
} from "@/app/routines/actions";

interface SearchHit {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
}

const TIME_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "am", label: "AM" },
  { value: "pm", label: "PM" },
  { value: "both", label: "AM + PM" },
];

const selectClass =
  "rounded-[9px] border border-border bg-white px-2.5 py-2 text-[13px] text-ink outline-none transition-colors focus:border-clay";

// Human-readable pieces for the read-only (view) mode: category, time of day,
// frequency, and — for custom schedules — the chosen day labels.
function scheduleSummary(step: BuilderStep): string[] {
  const parts: string[] = [];
  const cat = ROUTINE_CATEGORIES.find((c) => c.value === step.category);
  if (cat) parts.push(cat.label);
  const time = TIME_OPTIONS.find((t) => t.value === step.timeOfDay);
  if (time) parts.push(time.label);
  if (step.frequency === "custom") {
    const days = step.customDays.map((d) => DAY_LABELS[d]).filter(Boolean);
    parts.push(days.length ? days.join(", ") : "Custom days");
  } else {
    const freq = ROUTINE_FREQUENCIES.find((f) => f.value === step.frequency);
    if (freq) parts.push(freq.label);
  }
  return parts;
}

export function RoutineBuilder({
  routineId,
  initialName,
  initialDescription,
  initialSteps,
}: {
  routineId: string;
  initialName: string;
  initialDescription: string | null;
  initialSteps: BuilderStep[];
}) {
  const [steps, setSteps] = useState(initialSteps);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  // When set, the picker fills this quiz-seeded placeholder slot in place
  // instead of appending a new step.
  const [fillingStepId, setFillingStepId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  // Editable routine name + description. Persisted on blur (and when leaving
  // edit mode); `saved` refs track the last value written so we skip no-op saves.
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const savedName = useRef(initialName);
  const savedDescription = useRef(initialDescription ?? "");
  const router = useRouter();

  const persistMeta = () => {
    const trimmedName = name.trim() || "Untitled routine";
    if (trimmedName !== savedName.current || description !== savedDescription.current) {
      const patch = { name: trimmedName, description };
      savedName.current = trimmedName;
      savedDescription.current = description;
      startTransition(async () => {
        const res = await updateRoutineAction(routineId, patch);
        if (res.ok) router.refresh();
        else setError(res.error);
      });
    }
  };

  const apply = (action: () => Promise<ActionResult>, revertTo?: BuilderStep[]) => {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok) setSteps(res.steps);
      else {
        if (revertTo) setSteps(revertTo);
        setError(res.error);
      }
    });
  };

  // Schedule controls patch locally first so chips/selects feel instant, then
  // reconcile with the authoritative list the action returns.
  const patchStep = (stepId: string, patch: StepPatch) => {
    const prev = steps;
    setSteps((s) => s.map((st) => (st.id === stepId ? { ...st, ...patch } : st)));
    apply(() => updateStepAction(routineId, stepId, patch), prev);
  };

  // Drag-to-reorder. A small activation distance keeps clicks on the card's
  // controls from being read as drags; the keyboard sensor makes the grip
  // handle reorderable with the arrow keys too.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const prev = steps;
    const next = arrayMove(steps, oldIndex, newIndex);
    setSteps(next); // optimistic — snap the card into place immediately
    apply(() => reorderStepsAction(routineId, next.map((s) => s.id)), prev);
  };

  const toggleEditing = () => {
    if (editing) {
      persistMeta();
      setPickerOpen(false);
    }
    setEditing((e) => !e);
  };

  return (
    <div className="mt-8">
      {/* Editable routine name + description, with the Edit/Done toggle. */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={persistMeta}
                placeholder="Routine name"
                aria-label="Routine name"
                className="w-full rounded-[10px] border border-border bg-white px-3 py-2 font-serif text-[26px] font-medium tracking-tight text-ink outline-none transition-colors focus:border-clay"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={persistMeta}
                rows={2}
                placeholder="Add a short description (optional)"
                aria-label="Routine description"
                className="mt-2.5 w-full resize-y rounded-[10px] border border-border bg-white px-3 py-2 text-[14px] leading-relaxed text-ink outline-none transition-colors focus:border-clay"
              />
            </>
          ) : (
            <>
              <h1 className="font-serif text-3xl font-medium tracking-tight text-ink md:text-[32px]">
                {name}
              </h1>
              {description ? (
                <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={toggleEditing}
          className={
            "flex-shrink-0 rounded-[9px] border px-3.5 py-2 text-[13px] font-semibold transition-colors " +
            (editing
              ? "border-clay bg-secondary text-clay"
              : "border-border text-ink hover:bg-muted")
          }
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-[10px] border border-destructive/40 bg-[#fdf1ee] px-4 py-2.5 text-[13px] text-destructive">
          {error}
        </div>
      ) : null}

      {steps.length === 0 && !pickerOpen ? (
        <div className="rounded-[18px] border border-dashed border-[#d8ccba] bg-warm-white px-6 py-16 text-center">
          <div className="mx-auto mb-[18px] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#f3eadf] text-[26px] text-accent">
            ✦
          </div>
          <h2 className="font-serif text-[24px] font-medium text-ink">Start your routine</h2>
          <p className="mx-auto my-2.5 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            Search the catalog and add products — we&apos;ll keep the steps in the right order,
            from cleanser to sunscreen, and you can set when and how often you use each one.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setPickerOpen(true);
            }}
            className="rounded-[10px] bg-primary px-5 py-3 text-[14px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            + Add your first product
          </button>
        </div>
      ) : (
        <>
          {steps.length > 0 ? (
            <div className="mb-4 text-[13px] text-muted-foreground">
              {steps.length} {steps.length === 1 ? "step" : "steps"}
              {editing ? " · drag the handle to reorder" : ""}
            </div>
          ) : null}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={steps.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={i}
                    editing={editing}
                    busy={pending}
                    onPatch={(patch) => patchStep(step.id, patch)}
                    onDelete={() => apply(() => deleteStepAction(routineId, step.id))}
                    onChooseProduct={() => {
                      setFillingStepId(step.id);
                      setPickerOpen(true);
                    }}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>

          {editing && !pickerOpen ? (
            <button
              type="button"
              onClick={() => {
                setFillingStepId(null);
                setPickerOpen(true);
              }}
              className="mt-4 w-full rounded-[14px] border border-dashed border-[#d8ccba] bg-warm-white px-4 py-3.5 text-[14px] font-semibold text-clay transition-colors hover:bg-[#fff7ea]"
            >
              + Add product
            </button>
          ) : null}
        </>
      )}

      {pickerOpen && editing ? (
        <ProductPicker
          existingIds={new Set(steps.map((s) => s.productId).filter((x): x is string => !!x))}
          busy={pending}
          onAdd={(hit) =>
            apply(() =>
              fillingStepId
                ? setStepProductAction(routineId, fillingStepId, hit.id)
                : addStepAction(routineId, hit.id),
            )
          }
          onClose={() => {
            setPickerOpen(false);
            setFillingStepId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function StepCard({
  step,
  index,
  editing,
  busy,
  onPatch,
  onDelete,
  onChooseProduct,
}: {
  step: BuilderStep;
  index: number;
  editing: boolean;
  busy: boolean;
  onPatch: (patch: StepPatch) => void;
  onDelete: () => void;
  onChooseProduct: () => void;
}) {
  // Quiz-seeded placeholder: the slot exists, no product attached yet.
  const isEmptySlot = !step.productId;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id, disabled: !editing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const toggleDay = (day: number) => {
    const days = step.customDays.includes(day)
      ? step.customDays.filter((d) => d !== day)
      : [...step.customDays, day].sort((a, b) => a - b);
    onPatch({ customDays: days });
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={
        "rounded-[16px] border p-4 md:p-5 " +
        (isDragging
          ? "relative z-10 border-clay bg-white shadow-[0_12px_30px_-12px_rgba(60,45,25,0.45)]"
          : isEmptySlot
            ? "border-dashed border-[#d8ccba] bg-warm-white"
            : "border-border bg-white")
      }
    >
      <div className="flex items-start gap-4">
        {/* Product image on the left, with the step number as a corner badge. */}
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[12px] border border-border md:h-[72px] md:w-[72px]">
          <ProductThumb
            category={step.category}
            imageUrl={step.productImage}
            name={step.productName}
            className="h-full w-full"
            iconSize={32}
          />
          <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/85 text-[11px] font-semibold text-warm-white">
            {index + 1}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2.5">
            {step.productSlug ? (
              <Link
                href={`/product/${step.productSlug}`}
                className="font-serif text-[17px] leading-tight text-ink hover:underline"
              >
                {step.productName}
              </Link>
            ) : (
              <span className="font-serif text-[17px] leading-tight text-ink">
                {step.productName}
              </span>
            )}
            {step.productBrand ? (
              <span className="text-[11px] uppercase tracking-[0.12em] text-clay">
                {step.productBrand}
              </span>
            ) : null}
            {isEmptySlot ? (
              <span className="rounded-full bg-[#f0e6d6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-clay">
                Not picked yet
              </span>
            ) : null}
          </div>

          {isEmptySlot ? (
            <button
              type="button"
              onClick={onChooseProduct}
              disabled={busy}
              className="mt-2 rounded-[9px] border border-clay/40 bg-white px-3 py-1.5 text-[13px] font-semibold text-clay transition-colors hover:bg-[#fff7ea] disabled:opacity-50"
            >
              Choose your {step.productName.toLowerCase()} →
            </button>
          ) : null}

          {editing ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                {/* AM / PM / Both */}
                <div className="flex overflow-hidden rounded-[9px] border border-border">
                  {TIME_OPTIONS.map((t) => {
                    const active = step.timeOfDay === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        disabled={busy}
                        onClick={() => onPatch({ timeOfDay: t.value })}
                        className={
                          "px-3 py-2 text-[12px] font-semibold transition-colors " +
                          (active
                            ? "bg-secondary text-clay"
                            : "bg-white text-muted-foreground hover:text-ink")
                        }
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                <select
                  value={step.frequency}
                  disabled={busy}
                  onChange={(e) => onPatch({ frequency: e.target.value as RoutineFrequency })}
                  className={selectClass}
                  aria-label="Frequency"
                >
                  {ROUTINE_FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <select
                  value={step.category}
                  disabled={busy}
                  onChange={(e) => onPatch({ category: e.target.value as RoutineCategory })}
                  className={selectClass}
                  aria-label="Category"
                >
                  {ROUTINE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {step.frequency === "custom" ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {DAY_LABELS.map((label, day) => {
                    const active = step.customDays.includes(day);
                    return (
                      <button
                        key={label}
                        type="button"
                        disabled={busy}
                        onClick={() => toggleDay(day)}
                        className={
                          "rounded-full border px-2.5 py-1.5 text-[12px] transition-colors " +
                          (active
                            ? "border-clay bg-secondary font-semibold text-clay"
                            : "border-border text-muted-foreground hover:text-ink")
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : (
            // Read-only summary shown when not editing.
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted-foreground">
              {scheduleSummary(step).map((part, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 ? <span className="text-border">·</span> : null}
                  {part}
                </span>
              ))}
            </div>
          )}
        </div>

        {editing ? (
          <div className="flex flex-shrink-0 items-center gap-1">
            <button
              type="button"
              ref={setActivatorNodeRef}
              aria-label={`Drag to reorder ${step.productName}`}
              disabled={busy}
              {...attributes}
              {...listeners}
              className="flex h-8 w-8 touch-none items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30 cursor-grab active:cursor-grabbing"
            >
              <GripVertical size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Remove step"
              disabled={busy}
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[14px] text-muted-foreground transition-colors hover:bg-[#fdf1ee] hover:text-destructive disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function ProductPicker({
  existingIds,
  busy,
  onAdd,
  onClose,
}: {
  existingIds: Set<string>;
  busy: boolean;
  onAdd: (hit: SearchHit) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced catalog search — same endpoint the SiteNav typeahead uses.
  useEffect(() => {
    const needle = q.trim();
    if (!needle) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(needle)}`, {
          signal: controller.signal,
        });
        if (res.ok) setHits((await res.json()).results ?? []);
        setSearching(false);
      } catch {
        // aborted or offline — keep whatever we had
      }
    }, 200);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q]);

  return (
    <div className="mt-4 rounded-[16px] border border-border bg-white p-4">
      <div className="flex items-center gap-2.5">
        <span className="text-sm text-[#b3a690]">⌕</span>
        <input
          ref={inputRef}
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the catalog — try a product, brand, or ingredient"
          className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-[#b3a690]"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="text-xs text-[#b3a690] hover:text-clay"
        >
          ✕
        </button>
      </div>

      {q.trim() ? (
        <div className="mt-3 border-t border-[#f0e8da]">
          {hits.length === 0 ? (
            <div className="px-1 py-4 text-[13px] text-muted-foreground">
              {searching ? "Searching…" : (
                <>
                  No matches for <strong>&quot;{q}&quot;</strong>. You can add missing products
                  from a URL on the{" "}
                  <Link href="/add" className="text-clay underline underline-offset-2">
                    Add a product
                  </Link>{" "}
                  page.
                </>
              )}
            </div>
          ) : (
            hits.map((h) => {
              const added = existingIds.has(h.id);
              return (
                <div
                  key={h.id}
                  className="flex items-center gap-3 border-b border-[#f0e8da] px-1 py-3 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-ink">{h.name}</div>
                    <div className="text-[11px] uppercase tracking-wider text-clay">
                      {h.brand} · {h.category}
                    </div>
                  </div>
                  {added ? (
                    <span className="text-[12px] font-semibold text-muted-foreground">
                      In routine
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onAdd(h)}
                      className="rounded-[8px] bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      Add
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
