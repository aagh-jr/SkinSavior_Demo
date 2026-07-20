"use server";

// Server actions for the study-review queue. Actions are public endpoints, so
// each one re-runs the admin gate — the page-level check only hides the UI.

import { isAdminUser } from "@/lib/admin";
import { approveStudy, rejectStudy } from "@/lib/review-db";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function approveStudyAction(studyId: string): Promise<ActionResult> {
  if (!(await isAdminUser())) return { ok: false, error: "Not authorized." };
  if (!studyId) return { ok: false, error: "Missing study id." };
  try {
    await approveStudy(studyId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Approve failed." };
  }
}

export async function rejectStudyAction(studyId: string): Promise<ActionResult> {
  if (!(await isAdminUser())) return { ok: false, error: "Not authorized." };
  if (!studyId) return { ok: false, error: "Missing study id." };
  try {
    await rejectStudy(studyId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Reject failed." };
  }
}
