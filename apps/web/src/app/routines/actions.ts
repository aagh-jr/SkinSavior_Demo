"use server";

// Server actions for the routine builder. Each validates its input against
// the canonical value lists, performs the mutation as the signed-in user
// (RLS enforces ownership), and returns the full updated step list so the
// client can replace its state wholesale.

import {
  ROUTINE_CATEGORIES,
  ROUTINE_FREQUENCIES,
  type RoutineCategory,
  type RoutineFrequency,
  type TimeOfDay,
} from "@/lib/routine-categories";
import {
  addStep,
  createMyRoutine,
  deleteRoutine,
  deleteStep,
  reorderSteps,
  seedRoutineFromQuiz,
  setStepProduct,
  setPrimaryRoutine,
  updateRoutine,
  updateStep,
  type BuilderStep,
  type StepPatch,
} from "@/lib/routines-db";

export type ActionResult =
  | { ok: true; steps: BuilderStep[] }
  | { ok: false; error: string };

export type CreateRoutineResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const TIMES: TimeOfDay[] = ["am", "pm", "both"];
const FREQUENCIES = ROUTINE_FREQUENCIES.map((f) => f.value);
const CATEGORIES = ROUTINE_CATEGORIES.map((c) => c.value);

async function run(mutate: () => Promise<BuilderStep[]>): Promise<ActionResult> {
  try {
    return { ok: true, steps: await mutate() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function createRoutineAction(
  name?: string,
): Promise<CreateRoutineResult> {
  try {
    const id = await createMyRoutine(typeof name === "string" ? name : undefined);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't create routine." };
  }
}

/** Fill a quiz-seeded placeholder slot with a real catalog product. */
export async function setStepProductAction(
  routineId: string,
  stepId: string,
  productId: string,
): Promise<ActionResult> {
  return run(() => setStepProduct(routineId, stepId, productId));
}

/**
 * Post-quiz handoff: create the user's first routine pre-filled with empty
 * slots for the categories they said they already use.
 */
export async function seedRoutineFromQuizAction(): Promise<CreateRoutineResult> {
  try {
    const id = await seedRoutineFromQuiz();
    if (!id) return { ok: false, error: "You need to be signed in." };
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't build your routine." };
  }
}

export async function updateRoutineAction(
  routineId: string,
  patch: { name?: string; description?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof routineId !== "string" || !routineId) {
    return { ok: false, error: "Missing routine." };
  }
  const clean: { name?: string; description?: string | null } = {};
  if (typeof patch?.name === "string") clean.name = patch.name;
  if (patch?.description === null || typeof patch?.description === "string") {
    clean.description = patch.description;
  }
  try {
    await updateRoutine(routineId, clean);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't save routine." };
  }
}

export async function setPrimaryRoutineAction(
  routineId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof routineId !== "string" || !routineId) {
    return { ok: false, error: "Missing routine." };
  }
  try {
    await setPrimaryRoutine(routineId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't set primary routine." };
  }
}

export async function deleteRoutineAction(
  routineId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof routineId !== "string" || !routineId) {
    return { ok: false, error: "Missing routine." };
  }
  try {
    await deleteRoutine(routineId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't delete routine." };
  }
}

export async function addStepAction(
  routineId: string,
  productId: string,
): Promise<ActionResult> {
  if (typeof routineId !== "string" || !routineId) {
    return { ok: false, error: "Missing routine." };
  }
  if (typeof productId !== "string" || !productId) {
    return { ok: false, error: "Missing product." };
  }
  return run(() => addStep(routineId, productId));
}

export async function updateStepAction(
  routineId: string,
  stepId: string,
  patch: StepPatch,
): Promise<ActionResult> {
  if (typeof routineId !== "string" || !routineId) {
    return { ok: false, error: "Missing routine." };
  }
  const clean: StepPatch = {};
  if (patch.timeOfDay !== undefined) {
    if (!TIMES.includes(patch.timeOfDay)) return { ok: false, error: "Invalid time of day." };
    clean.timeOfDay = patch.timeOfDay;
  }
  if (patch.frequency !== undefined) {
    if (!FREQUENCIES.includes(patch.frequency as RoutineFrequency)) {
      return { ok: false, error: "Invalid frequency." };
    }
    clean.frequency = patch.frequency;
  }
  if (patch.customDays !== undefined) {
    const days = Array.isArray(patch.customDays) ? patch.customDays : [];
    if (!days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
      return { ok: false, error: "Invalid days." };
    }
    clean.customDays = [...new Set(days)].sort((a, b) => a - b);
  }
  if (patch.category !== undefined) {
    if (!CATEGORIES.includes(patch.category as RoutineCategory)) {
      return { ok: false, error: "Invalid category." };
    }
    clean.category = patch.category;
  }
  return run(() => updateStep(routineId, stepId, clean));
}

export async function reorderStepsAction(
  routineId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  if (typeof routineId !== "string" || !routineId) {
    return { ok: false, error: "Missing routine." };
  }
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "string")) {
    return { ok: false, error: "Invalid order." };
  }
  return run(() => reorderSteps(routineId, orderedIds));
}

export async function deleteStepAction(
  routineId: string,
  stepId: string,
): Promise<ActionResult> {
  if (typeof routineId !== "string" || !routineId) {
    return { ok: false, error: "Missing routine." };
  }
  return run(() => deleteStep(routineId, stepId));
}
