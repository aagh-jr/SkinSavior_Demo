/**
 * Pilot allowlist: the most-researched skincare ingredients we fetch PubMed
 * data for. Keyed by `ingredients.normalized_name` (lower(btrim(inci_name))).
 *
 * Scoping the feature to this set keeps the first release small and avoids
 * firing PubMed queries for the ~2.3k-row catalog. `searchTerm` is what we send
 * to PubMed — usually the base ingredient, occasionally a clearer synonym than
 * the raw INCI name.
 *
 * Derived from a web survey of dermatology evidence reviews (July 2026), then
 * intersected with the live `ingredients` table — 23 of the top-30 had a row.
 * The 7 that were missing from the catalog (azelaic acid through copper
 * peptides below) were later seeded as catalog rows and added here, plus
 * alpha-arbutin since product labels usually print that form. Copper peptides
 * are listed under their INCI name, copper tripeptide-1, searched as GHK-Cu
 * (its name in the literature — "copper tripeptide-1" barely appears).
 */
export interface ResearchedIngredient {
  /** Matches `ingredients.normalized_name`. */
  normalizedName: string;
  /** Human label (for the seed script / logging). */
  label: string;
  /** Term sent to PubMed. */
  searchTerm: string;
}

export const RESEARCHED_INGREDIENTS: ResearchedIngredient[] = [
  { normalizedName: "retinol", label: "Retinol", searchTerm: "retinol" },
  { normalizedName: "niacinamide", label: "Niacinamide", searchTerm: "niacinamide" },
  { normalizedName: "ascorbic acid", label: "Vitamin C", searchTerm: "ascorbic acid" },
  { normalizedName: "hyaluronic acid", label: "Hyaluronic Acid", searchTerm: "hyaluronic acid" },
  { normalizedName: "salicylic acid", label: "Salicylic Acid", searchTerm: "salicylic acid" },
  { normalizedName: "glycolic acid", label: "Glycolic Acid", searchTerm: "glycolic acid" },
  { normalizedName: "lactic acid", label: "Lactic Acid", searchTerm: "lactic acid" },
  { normalizedName: "tocopherol", label: "Vitamin E", searchTerm: "tocopherol" },
  { normalizedName: "ceramide np", label: "Ceramides", searchTerm: "ceramide" },
  { normalizedName: "squalane", label: "Squalane", searchTerm: "squalane" },
  { normalizedName: "zinc oxide", label: "Zinc Oxide", searchTerm: "zinc oxide sunscreen" },
  { normalizedName: "titanium dioxide", label: "Titanium Dioxide", searchTerm: "titanium dioxide sunscreen" },
  { normalizedName: "kojic acid", label: "Kojic Acid", searchTerm: "kojic acid" },
  { normalizedName: "bakuchiol", label: "Bakuchiol", searchTerm: "bakuchiol" },
  { normalizedName: "panthenol", label: "Panthenol", searchTerm: "panthenol" },
  { normalizedName: "allantoin", label: "Allantoin", searchTerm: "allantoin" },
  { normalizedName: "centella asiatica extract", label: "Centella Asiatica", searchTerm: "centella asiatica" },
  { normalizedName: "camellia sinensis leaf extract", label: "Green Tea", searchTerm: "green tea polyphenols skin" },
  { normalizedName: "resveratrol", label: "Resveratrol", searchTerm: "resveratrol" },
  { normalizedName: "caffeine", label: "Caffeine", searchTerm: "caffeine" },
  { normalizedName: "urea", label: "Urea", searchTerm: "urea" },
  { normalizedName: "glycerin", label: "Glycerin", searchTerm: "glycerin" },
  { normalizedName: "avena sativa", label: "Colloidal Oatmeal", searchTerm: "colloidal oatmeal" },
  { normalizedName: "azelaic acid", label: "Azelaic Acid", searchTerm: "azelaic acid" },
  { normalizedName: "benzoyl peroxide", label: "Benzoyl Peroxide", searchTerm: "benzoyl peroxide" },
  { normalizedName: "hydroquinone", label: "Hydroquinone", searchTerm: "hydroquinone" },
  { normalizedName: "tranexamic acid", label: "Tranexamic Acid", searchTerm: "tranexamic acid" },
  { normalizedName: "arbutin", label: "Arbutin", searchTerm: "arbutin" },
  { normalizedName: "alpha-arbutin", label: "Alpha-Arbutin", searchTerm: "alpha-arbutin" },
  { normalizedName: "ferulic acid", label: "Ferulic Acid", searchTerm: "ferulic acid" },
  { normalizedName: "copper tripeptide-1", label: "Copper Peptides", searchTerm: "GHK-Cu" },
];

const BY_NAME = new Map(RESEARCHED_INGREDIENTS.map((i) => [i.normalizedName, i]));

/** Normalize an INCI name the same way the DB's generated column does. */
export function normalizeName(inciName: string): string {
  return inciName.trim().toLowerCase();
}

/** Whether an ingredient (by raw INCI name) is in the research pilot. */
export function isResearched(inciName: string): boolean {
  return BY_NAME.has(normalizeName(inciName));
}

/** Look up the pilot entry for an ingredient, if any. */
export function researchedFor(inciName: string): ResearchedIngredient | undefined {
  return BY_NAME.get(normalizeName(inciName));
}
