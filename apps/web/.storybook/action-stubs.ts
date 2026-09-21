// Storybook-only stubs for the server actions that reach the database. The
// real modules import the server-only `-db` stack (products-db, ingredients-db,
// routines-db), which pulls Supabase admin, zod schemas and node-only code that
// can't be evaluated in the browser — and a server action can't run in
// Storybook anyway. main.ts aliases @/app/{search,ingredients,routines}/actions
// here so those components import harmless no-ops.
//
// Names must match every export the story-rendered components import.

const emptyPage = { rows: [], total: 0, hasMore: false };

// search/actions
export async function fetchProductsPage() {
  return emptyPage;
}

// ingredients/actions
export async function fetchIngredientsPage() {
  return emptyPage;
}

// routines/actions — no-ops; stories render, they don't invoke these.
const ok = async () => ({ ok: true }) as never;
export const createRoutineAction = ok;
export const setStepProductAction = ok;
export const seedRoutineFromQuizAction = ok;
export const updateRoutineAction = ok;
export const setPrimaryRoutineAction = ok;
export const deleteRoutineAction = ok;
export const addStepAction = ok;
export const updateStepAction = ok;
export const reorderStepsAction = ok;
export const deleteStepAction = ok;

// review/actions
export const approveStudyAction = ok;
export const rejectStudyAction = ok;
