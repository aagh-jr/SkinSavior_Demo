import type { RoutineCategory } from "@/lib/routine-categories";

// Map a free-text product category (e.g. "Cleanser", "Vitamin C Serum",
// "SPF 50 Sunscreen") onto a canonical routine category so we can pick the
// matching CategoryIcon. Keyword order matters: more specific phrases are
// checked before broad ones (e.g. "oil cleanser" before "cleanser",
// "eye" before generic "cream"). Unknown categories fall back to "other".
export function categoryToCanonical(
  raw: string | null | undefined,
): RoutineCategory {
  // Lowercase + turn "oil_cleanser" style canonical values into "oil cleanser"
  // so both free-text categories and canonical keys match the same rules.
  const s = (raw ?? "").toLowerCase().replace(/_/g, " ");
  if (!s.trim()) return "other";
  const has = (...needles: string[]) => needles.some((n) => s.includes(n));

  if (has("oil cleanser", "cleansing oil", "cleansing balm", "balm cleanser"))
    return "oil_cleanser";
  if (has("cleanser", "cleansing", "face wash", "facewash", "foam"))
    return "cleanser";
  if (has("exfoliant", "exfoliat", "scrub", "peel", "aha", "bha", "pha"))
    return "exfoliant";
  if (has("mask", "masque")) return "mask";
  if (has("toner", "mist")) return "toner";
  if (has("essence")) return "essence";
  if (has("eye")) return "eye_cream";
  if (has("spot", "acne", "blemish", "pimple", "patch")) return "spot_treatment";
  if (has("serum", "ampoule", "booster")) return "serum";
  if (has("face oil", "facial oil")) return "face_oil";
  if (has("lip")) return "lip_balm";
  if (has("sunscreen", "spf")) return "sunscreen";
  if (has("moistur", "cream", "lotion", "emulsion", "hydrat", "gel"))
    return "moisturizer";

  return "other";
}
