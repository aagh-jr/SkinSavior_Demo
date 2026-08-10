import type { Json } from "@skinsavior/core/supabase";
import { supabase } from "@/lib/supabase/client";

// Quiz answers pending persistence. Stored in localStorage (not
// sessionStorage) so they survive the email-confirmation round trip,
// which usually lands in a fresh tab.
export type QuizAnswers = {
  // Baumann axis 1: oily <-> dry
  skin_type?: string;
  // Baumann axis 2: sensitive <-> resistant (behavior-based question, but
  // still stored as a low/medium/high bucket in the existing column)
  sensitivity?: string;
  // Baumann axis 3: pigmented <-> non-pigmented
  pigmentation?: string;
  // Baumann axis 4: wrinkle-prone <-> tight
  aging_concern?: string;
  // Fitzpatrick-lite phototype proxy (burn/tan behavior, not just exposure)
  sun_reaction?: string;
  sun_exposure?: string;
  age_range?: string;
  // Safety-relevant fields standard on dermatology intake forms
  medications?: string[];
  pregnancy_status?: string;
  current_routine?: string[];
  reactions?: string[];
  routine_complexity?: string;
  budget?: string[];
  // Legacy keys from retired survey versions may still appear in old
  // stashes (concerns, goals, fragrance_pref, pregnancy_safe, …).
  [key: string]: string | string[] | undefined;
};

const KEY = "skinsavior:pendingAnswers";

export function stashPendingAnswers(answers: QuizAnswers) {
  try {
    localStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    /* ignore */
  }
}

export function readPendingAnswers(): QuizAnswers | null {
  try {
    // sessionStorage fallback covers stashes from before the localStorage move
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QuizAnswers) : null;
  } catch {
    return null;
  }
}

export function clearPendingAnswers() {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

// Upserts the signed-in user's profile with their quiz answers.
// Returns false when there's no session (e.g. signup still awaiting
// email confirmation) or the upsert fails.
export async function persistAnswers(answers: QuizAnswers): Promise<boolean> {
  // Skipped survey (or empty stash): nothing to write — succeed without
  // clobbering any previously saved answers with nulls.
  const hasAny = Object.values(answers).some((v) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v),
  );
  if (!hasAny) return true;
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return false;
  const userId = sess.session.user.id;
  // Tolerates legacy stashes where budget/reactions were single-select strings
  const toArray = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v : v ? [v] : [];
  const update = {
    id: userId,
    skin_type: answers.skin_type ?? null,
    sensitivity: answers.sensitivity ?? null,
    pigmentation: answers.pigmentation ?? null,
    aging_concern: answers.aging_concern ?? null,
    sun_reaction: answers.sun_reaction ?? null,
    age_range: answers.age_range ?? null,
    sun_exposure: answers.sun_exposure ?? null,
    medications: toArray(answers.medications),
    pregnancy_status: answers.pregnancy_status ?? null,
    current_routine: toArray(answers.current_routine),
    routine_complexity: answers.routine_complexity ?? null,
    budget: toArray(answers.budget),
    reactions: toArray(answers.reactions),
    answers: answers as Json,
  };
  const { error } = await supabase
    .from("profiles")
    // "as never": same Database-generic quirk worked around across the
    // codebase (settings, routines-db) — the update shape matches the
    // profiles Insert type in @skinsavior/core/supabase.
    .upsert(update as never, { onConflict: "id" });
  return !error;
}

// Persists any stashed answers if a session exists, clearing the stash
// on success. Safe to call whenever auth state changes.
export async function flushPendingAnswers(): Promise<boolean> {
  const pending = readPendingAnswers();
  if (!pending) return false;
  const ok = await persistAnswers(pending);
  if (ok) clearPendingAnswers();
  return ok;
}
