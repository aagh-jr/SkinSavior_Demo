// Server-only access to the signed-in user's personal routine.
//
// Everything runs through the cookie-aware user client, so the RLS owner
// policies (routines_all_own / routine_steps_all_own) are what enforce
// access — no service-role key in this path.
//
// Ordering model: step_order is the persisted position. New steps and
// category changes are auto-slotted to the end of their category group
// (categoryRank order, cleanser → sunscreen); the arrows let the user
// override within that.
//
// Like products-db.ts, the generated Database types don't include the
// routine-builder columns until the 20260704 migration is applied and types
// are regenerated, so this module keeps its own row types over an untyped
// client. Once types are regenerated, drop the cast and these interfaces.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  categoryRank,
  coarseToCanonical,
  quizAnswerToSeedSlots,
  type RoutineCategory,
  type RoutineFrequency,
  type TimeOfDay,
} from "@/lib/routine-categories";

export interface BuilderStep {
  id: string;
  productId: string | null;
  productSlug: string | null;
  productName: string;
  productBrand: string;
  productImage: string | null;
  category: RoutineCategory;
  timeOfDay: TimeOfDay;
  frequency: RoutineFrequency;
  customDays: number[];
}

export interface StepPatch {
  timeOfDay?: TimeOfDay;
  frequency?: RoutineFrequency;
  customDays?: number[];
  category?: RoutineCategory;
}

interface StepRow {
  id: string;
  product_id: string | null;
  step_order: number;
  time_of_day: TimeOfDay;
  frequency: RoutineFrequency;
  custom_days: number[];
  category: RoutineCategory;
  note: string | null;
  products: {
    slug: string;
    name: string;
    brand: string;
    image_url: string | null;
  } | null;
}

const STEP_SELECT =
  "id, product_id, step_order, time_of_day, frequency, custom_days, category, note, products(slug, name, brand, image_url)";

async function userDb(): Promise<{ db: SupabaseClient; userId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { db: supabase as unknown as SupabaseClient, userId: user.id };
}

function rowToStep(row: StepRow): BuilderStep {
  return {
    id: row.id,
    productId: row.product_id,
    productSlug: row.products?.slug ?? null,
    productName: row.products?.name ?? row.note ?? "Unknown product",
    productBrand: row.products?.brand ?? "",
    productImage: row.products?.image_url ?? null,
    category: row.category,
    timeOfDay: row.time_of_day,
    frequency: row.frequency,
    customDays: row.custom_days ?? [],
  };
}

export interface RoutineSummary {
  id: string;
  name: string;
  description: string | null;
  stepCount: number;
  isPrimary: boolean;
  createdAt: string;
}

// TEMPORARY: some columns (skincare_routines.description → migration
// 20260704130000, profiles.primary_routine_id → 20260704140000) may not be
// applied to the live DB yet. Detect the "column doesn't exist" error so
// reads/writes can fall back and the page keeps working. Drop these guards
// (and the fallbacks) once the migrations are live.
function isMissingColumn(
  error: { code?: string; message?: string } | null,
  column: string,
): boolean {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  return !!error.message && error.message.toLowerCase().includes(column.toLowerCase());
}

function isMissingDescription(error: { code?: string; message?: string } | null): boolean {
  return isMissingColumn(error, "description");
}

/** The user's chosen primary routine id (null if unset or column not live). */
async function getPrimaryRoutineId(
  db: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await db
    .from("profiles")
    .select("primary_routine_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) return null; // column missing (pre-migration) or no row → no primary
  return (data as { primary_routine_id: string | null } | null)?.primary_routine_id ?? null;
}

// skincare_routines.profile_id references profiles(id). The signup trigger that
// used to seed a profiles row isn't firing on the live DB, so a user who signed
// up but skipped the quiz has no profile and a routine insert would fail its FK.
// Ensure the row exists first (RLS allows a user to create their own profile);
// ON CONFLICT keeps an existing profile intact.
async function ensureProfile(db: SupabaseClient, userId: string): Promise<void> {
  const { error } = await db
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`Couldn't set up your profile: ${error.message}`);
}

/** All of the signed-in user's routines, oldest first, with step counts. */
export async function listMyRoutines(): Promise<RoutineSummary[]> {
  const ctx = await userDb();
  if (!ctx) return [];
  const first = await ctx.db
    .from("skincare_routines")
    .select("id, name, description, created_at, routine_steps(count)")
    .eq("profile_id", ctx.userId)
    .order("created_at");
  let data: unknown = first.data;
  let error = first.error;
  if (error && isMissingDescription(error)) {
    const retry = await ctx.db
      .from("skincare_routines")
      .select("id, name, created_at, routine_steps(count)")
      .eq("profile_id", ctx.userId)
      .order("created_at");
    data = retry.data;
    error = retry.error;
  }
  if (error) throw new Error(`Couldn't load your routines: ${error.message}`);
  const primaryId = await getPrimaryRoutineId(ctx.db, ctx.userId);
  const rows = (data ?? []) as unknown as {
    id: string;
    name: string | null;
    description?: string | null;
    created_at: string;
    routine_steps: { count: number }[] | null;
  }[];
  // With a single routine, it's the primary by default (no need to choose). The
  // explicit choice only matters once there are two or more.
  const effectivePrimaryId =
    primaryId ?? (rows.length === 1 ? rows[0].id : null);
  return rows.map((r) => ({
    id: r.id,
    name: r.name ?? "Untitled routine",
    description: r.description ?? null,
    stepCount: r.routine_steps?.[0]?.count ?? 0,
    isPrimary: r.id === effectivePrimaryId,
    createdAt: r.created_at,
  }));
}

/** Create a new empty routine and return its id. */
export async function createMyRoutine(name?: string): Promise<string> {
  const ctx = await userDb();
  if (!ctx) throw new Error("You need to be signed in to create a routine.");
  const { db, userId } = ctx;
  await ensureProfile(db, userId);

  // The live skincare_routines_routine_type_check constraint only allows
  // 'morning' | 'evening' | 'custom'; the builder is one combined AM+PM
  // routine, so 'custom' is the honest fit.
  const { data, error } = await db
    .from("skincare_routines")
    .insert({
      profile_id: userId,
      name: name?.trim() || "New routine",
      routine_type: "custom",
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`Couldn't create your routine: ${error?.message ?? "unknown error"}`);
  }
  return (data as { id: string }).id;
}

/**
 * Create the user's first routine, pre-seeded from their quiz answers.
 *
 * The quiz already asks which product categories they use; turning those into
 * labelled empty slots makes the builder a fill-in-the-blank rather than a
 * blank page, which is the difference between users finishing a routine and
 * abandoning it. Routine data is also what the compatibility checks run on,
 * so this is the step that makes those features possible at all.
 *
 * Placeholder steps carry product_id = null and the label in `note`
 * (rowToStep already falls back to note for the display name).
 *
 * Returns the new routine id. If the user already has routines we return the
 * most recent instead of stacking duplicates — this runs right after signup,
 * which is retry-prone (email confirmation, OAuth round trips).
 */
export async function seedRoutineFromQuiz(): Promise<string | null> {
  const ctx = await userDb();
  if (!ctx) return null;
  const { db, userId } = ctx;

  const existing = await db
    .from("skincare_routines")
    .select("id")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (existing.data?.length) return (existing.data[0] as { id: string }).id;

  const profile = await db
    .from("profiles")
    .select("current_routine")
    .eq("id", userId)
    .maybeSingle();
  const answers =
    (profile.data as { current_routine: string[] | null } | null)?.current_routine ?? null;
  const slots = quizAnswerToSeedSlots(answers);

  const routineId = await createMyRoutine("My routine");
  if (!slots.length) return routineId;

  const { error } = await db.from("routine_steps").insert(
    slots.map((slot, i) => ({
      routine_id: routineId,
      product_id: null,
      step_order: i,
      category: slot.category,
      time_of_day: slot.timeOfDay,
      note: slot.label,
    })),
  );
  // A seeding failure shouldn't cost the user their routine — they can still
  // add steps by hand.
  if (error) console.error("Couldn't seed routine slots:", error.message);

  return routineId;
}

/** A single routine the user owns (null if missing or not theirs). */
export async function getRoutine(
  routineId: string,
): Promise<{ id: string; name: string; description: string | null } | null> {
  const ctx = await userDb();
  if (!ctx) return null;
  const first = await ctx.db
    .from("skincare_routines")
    .select("id, name, description")
    .eq("id", routineId)
    .eq("profile_id", ctx.userId)
    .maybeSingle();
  let data: unknown = first.data;
  let error = first.error;
  if (error && isMissingDescription(error)) {
    const retry = await ctx.db
      .from("skincare_routines")
      .select("id, name")
      .eq("id", routineId)
      .eq("profile_id", ctx.userId)
      .maybeSingle();
    data = retry.data;
    error = retry.error;
  }
  if (!data) return null;
  const r = data as { id: string; name: string | null; description?: string | null };
  return { id: r.id, name: r.name ?? "Routine", description: r.description ?? null };
}

/** Rename a routine and/or update its description. */
export async function updateRoutine(
  routineId: string,
  patch: { name?: string; description?: string | null },
): Promise<void> {
  const ctx = await userDb();
  if (!ctx) throw new Error("You need to be signed in.");

  const upd: Record<string, unknown> = {};
  if (patch.name !== undefined) upd.name = patch.name.trim() || "Untitled routine";
  if (patch.description !== undefined) {
    upd.description =
      typeof patch.description === "string"
        ? patch.description.trim() || null
        : null;
  }
  if (Object.keys(upd).length === 0) return;

  const { error } = await ctx.db
    .from("skincare_routines")
    .update(upd as never)
    .eq("id", routineId)
    .eq("profile_id", ctx.userId);
  if (!error) return;

  // Fall back to name-only if the description column isn't live yet, so a
  // rename still saves. (See isMissingDescription note.)
  if (isMissingDescription(error) && upd.name !== undefined) {
    const { error: nameErr } = await ctx.db
      .from("skincare_routines")
      .update({ name: upd.name } as never)
      .eq("id", routineId)
      .eq("profile_id", ctx.userId);
    if (!nameErr) return;
    throw new Error(`Couldn't save the routine: ${nameErr.message}`);
  }
  throw new Error(`Couldn't save the routine: ${error.message}`);
}

/** Delete a routine and its steps. */
export async function deleteRoutine(routineId: string): Promise<void> {
  const ctx = await userDb();
  if (!ctx) throw new Error("You need to be signed in.");
  const { db, userId } = ctx;

  // Remove child steps first — the FK may not be ON DELETE CASCADE, and the
  // step RLS already scopes deletes to routines the user owns.
  const { error: stepErr } = await db
    .from("routine_steps")
    .delete()
    .eq("routine_id", routineId);
  if (stepErr) throw new Error(`Couldn't delete the routine: ${stepErr.message}`);

  const { error } = await db
    .from("skincare_routines")
    .delete()
    .eq("id", routineId)
    .eq("profile_id", userId);
  if (error) throw new Error(`Couldn't delete the routine: ${error.message}`);
}

/** Mark a routine the user owns as their primary (home-page) routine. */
export async function setPrimaryRoutine(routineId: string): Promise<void> {
  const ctx = await userDb();
  if (!ctx) throw new Error("You need to be signed in.");
  const { db, userId } = ctx;

  // Confirm the routine is the user's before pointing the profile at it.
  const routine = await getRoutine(routineId);
  if (!routine) throw new Error("Routine not found.");

  const { error } = await db
    .from("profiles")
    .update({ primary_routine_id: routineId } as never)
    .eq("id", userId);
  if (error) {
    if (isMissingColumn(error, "primary_routine_id")) {
      throw new Error(
        "Primary routines aren't enabled yet — apply the primary_routine migration.",
      );
    }
    throw new Error(`Couldn't set your primary routine: ${error.message}`);
  }
}

export interface HomeRoutine {
  id: string;
  name: string;
  steps: BuilderStep[];
}

/**
 * The routine to feature on the home page: the user's primary routine, or —
 * if none is set — their first routine. Null when they have no routines.
 */
export async function getHomeRoutine(): Promise<HomeRoutine | null> {
  const routines = await listMyRoutines();
  if (routines.length === 0) return null;
  const chosen = routines.find((r) => r.isPrimary) ?? routines[0];
  const steps = await getRoutineSteps(chosen.id);
  return { id: chosen.id, name: chosen.name, steps };
}

async function listStepRows(db: SupabaseClient, routineId: string): Promise<StepRow[]> {
  const { data, error } = await db
    .from("routine_steps")
    .select(STEP_SELECT)
    .eq("routine_id", routineId)
    .order("step_order");
  if (error) throw new Error(`Couldn't load routine steps: ${error.message}`);
  return (data ?? []) as unknown as StepRow[];
}

/** Persist a new ordering; only rows whose position changed are written. */
async function renumber(db: SupabaseClient, orderedIds: string[], rows: StepRow[]): Promise<void> {
  const current = new Map(rows.map((r) => [r.id, r.step_order]));
  const changed = orderedIds
    .map((id, i) => ({ id, i }))
    .filter(({ id, i }) => current.get(id) !== i);
  if (changed.length === 0) return;

  // The (routine_id, step_order) unique index means we can't just write the
  // final positions directly: a swap would momentarily give two rows the same
  // order and Postgres rejects the write. So we do it in two passes — first
  // "park" every moving row at a distinct negative offset (which can't collide
  // with the live 0..n-1 positions), then set the real positions.
  const park = await Promise.all(
    changed.map(({ id }, k) =>
      db.from("routine_steps").update({ step_order: -1 - k }).eq("id", id),
    ),
  );
  const parkErr = park.find((r) => r.error);
  if (parkErr?.error) throw new Error(`Couldn't reorder steps: ${parkErr.error.message}`);

  const set = await Promise.all(
    changed.map(({ id, i }) =>
      db.from("routine_steps").update({ step_order: i }).eq("id", id),
    ),
  );
  const setErr = set.find((r) => r.error);
  if (setErr?.error) throw new Error(`Couldn't reorder steps: ${setErr.error.message}`);
}

/** Index at which a step of `category` slots in: end of its category group. */
function slotIndex(others: StepRow[], category: RoutineCategory): number {
  const rank = categoryRank(category);
  return others.filter((r) => categoryRank(r.category) <= rank).length;
}

/** A routine's steps in display order ([] when none yet or not the user's). */
export async function getRoutineSteps(routineId: string): Promise<BuilderStep[]> {
  const ctx = await userDb();
  if (!ctx) return [];
  // RLS on routine_steps scopes this to steps of routines the user owns.
  return (await listStepRows(ctx.db, routineId)).map(rowToStep);
}

/** Add a catalog product as a step, auto-slotted by category. */
/**
 * Attach a product to an existing placeholder step, in place.
 *
 * Quiz-seeded slots start with product_id = null and the category label in
 * `note`. Filling one has to UPDATE that row rather than insert a new step,
 * otherwise the user ends up with the placeholder plus a duplicate. The
 * placeholder label is cleared once a real product supplies the name; the
 * user's chosen time_of_day and frequency are deliberately preserved.
 */
export async function setStepProduct(
  routineId: string,
  stepId: string,
  productId: string,
): Promise<BuilderStep[]> {
  const ctx = await userDb();
  if (!ctx) throw new Error("You need to be signed in to build a routine.");
  const { db } = ctx;

  const { data: product } = await db
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (!product) throw new Error("That product doesn't exist in the catalog.");

  const { error } = await db
    .from("routine_steps")
    .update({ product_id: productId, note: null })
    .eq("id", stepId)
    .eq("routine_id", routineId);
  if (error) throw new Error(`Couldn't add the product: ${error.message}`);

  const rows = await listStepRows(db, routineId);
  return rows.map(rowToStep);
}

export async function addStep(
  routineId: string,
  productId: string,
): Promise<BuilderStep[]> {
  const ctx = await userDb();
  if (!ctx) throw new Error("You need to be signed in to build a routine.");
  const { db } = ctx;

  const { data: product } = await db
    .from("products")
    .select("id, category")
    .eq("id", productId)
    .maybeSingle();
  if (!product) throw new Error("That product doesn't exist in the catalog.");
  const category = coarseToCanonical((product as { category: string | null }).category);

  const rows = await listStepRows(db, routineId);
  const { data: inserted, error } = await db
    .from("routine_steps")
    .insert({
      routine_id: routineId,
      product_id: productId,
      step_order: rows.length,
      category,
    })
    .select(STEP_SELECT)
    .single();
  if (error || !inserted) {
    throw new Error(`Couldn't add the product: ${error?.message ?? "unknown error"}`);
  }
  const newRow = inserted as unknown as StepRow;

  const orderedIds = rows.map((r) => r.id);
  orderedIds.splice(slotIndex(rows, category), 0, newRow.id);
  await renumber(db, orderedIds, [...rows, newRow]);

  return (await listStepRows(db, routineId)).map(rowToStep);
}

/** Update a step's schedule/category; category changes re-slot the step. */
export async function updateStep(
  routineId: string,
  stepId: string,
  patch: StepPatch,
): Promise<BuilderStep[]> {
  const ctx = await userDb();
  if (!ctx) throw new Error("You need to be signed in to build a routine.");
  const { db } = ctx;

  const upd: Record<string, unknown> = {};
  if (patch.timeOfDay !== undefined) upd.time_of_day = patch.timeOfDay;
  if (patch.frequency !== undefined) upd.frequency = patch.frequency;
  if (patch.customDays !== undefined) upd.custom_days = patch.customDays;
  if (patch.category !== undefined) upd.category = patch.category;
  if (Object.keys(upd).length > 0) {
    const { error } = await db
      .from("routine_steps")
      .update(upd)
      .eq("id", stepId)
      .eq("routine_id", routineId);
    if (error) throw new Error(`Couldn't save the change: ${error.message}`);
  }

  const rows = await listStepRows(db, routineId);
  if (patch.category !== undefined) {
    const others = rows.filter((r) => r.id !== stepId);
    const orderedIds = others.map((r) => r.id);
    orderedIds.splice(slotIndex(others, patch.category), 0, stepId);
    await renumber(db, orderedIds, rows);
    return (await listStepRows(db, routineId)).map(rowToStep);
  }
  return rows.map(rowToStep);
}

/**
 * Persist an arbitrary drag-and-drop ordering. `orderedIds` must be a
 * permutation of the routine's current step ids; any unknown or missing id
 * is rejected so a stale client can't corrupt the ordering.
 */
export async function reorderSteps(
  routineId: string,
  orderedIds: string[],
): Promise<BuilderStep[]> {
  const ctx = await userDb();
  if (!ctx) throw new Error("You need to be signed in to build a routine.");
  const { db } = ctx;

  const rows = await listStepRows(db, routineId);
  const currentIds = new Set(rows.map((r) => r.id));
  // The proposed order must cover exactly the current steps — no more, no less.
  const sameSet =
    orderedIds.length === rows.length &&
    orderedIds.every((id) => currentIds.has(id)) &&
    new Set(orderedIds).size === orderedIds.length;
  if (!sameSet) return rows.map(rowToStep);

  await renumber(db, orderedIds, rows);
  return (await listStepRows(db, routineId)).map(rowToStep);
}

export async function deleteStep(
  routineId: string,
  stepId: string,
): Promise<BuilderStep[]> {
  const ctx = await userDb();
  if (!ctx) throw new Error("You need to be signed in to build a routine.");
  const { db } = ctx;

  const { error } = await db
    .from("routine_steps")
    .delete()
    .eq("id", stepId)
    .eq("routine_id", routineId);
  if (error) throw new Error(`Couldn't remove the step: ${error.message}`);

  const rows = await listStepRows(db, routineId);
  await renumber(db, rows.map((r) => r.id), rows);
  return rows.map(rowToStep);
}
