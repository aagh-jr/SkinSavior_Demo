// Curated filter categories for the ingredients library.
//
// The catalog stores raw INCI function tags (from Open Beauty Facts) in the
// `functions text[]` column — things like "moisturizer/humectant" or
// "surfactant/cleansing". Those are noisy and inconsistent, so we group them
// into a small set of skincare-relevant categories. Each category maps to the
// raw tokens that belong to it; the DB query matches a row if its `functions`
// array overlaps the category's tokens.
//
// This module is plain data (no server imports) so it can be shared by the
// server-side query and the client filter chips.

export interface IngredientFilter {
  /** URL/state key. */
  key: string;
  /** Chip label shown to the user. */
  label: string;
  /** Raw `functions` tokens (lowercase) that fall under this category. */
  tokens: string[];
}

// Ordered by how interesting they are to someone reading their skincare —
// actives first, formulation helpers last.
export const INGREDIENT_FILTERS: IngredientFilter[] = [
  { key: "antioxidant", label: "Antioxidants", tokens: ["antioxidant"] },
  { key: "exfoliant", label: "Exfoliants", tokens: ["exfoliant", "abrasive/scrub"] },
  {
    key: "hydrator",
    label: "Hydrators",
    tokens: ["moisturizer/humectant", "skin-identical ingredient", "nmf"],
  },
  { key: "soothing", label: "Soothing", tokens: ["soothing"] },
  { key: "brightening", label: "Brightening", tokens: ["skin brightening"] },
  { key: "anti-acne", label: "Anti-acne", tokens: ["anti-acne"] },
  {
    key: "active",
    label: "Cell-communicating",
    tokens: ["cell-communicating ingredient"],
  },
  { key: "cleanser", label: "Cleansers", tokens: ["surfactant/cleansing"] },
  { key: "emollient", label: "Emollients", tokens: ["emollient"] },
  { key: "uv", label: "UV filters", tokens: ["sunscreen", "uv-filters"] },
  {
    key: "preservative",
    label: "Preservatives",
    tokens: ["preservative", "antimicrobial/antibacterial", "preservative options"],
  },
  {
    key: "fragrance-color",
    label: "Fragrance & color",
    tokens: ["perfuming", "colorant", "deodorant"],
  },
  {
    key: "texture",
    label: "Texture & emulsifiers",
    tokens: [
      "emulsifying",
      "viscosity controlling",
      "emulsion stabilising",
      "solvent",
      "absorbent/mattifier",
      "buffering",
      "chelating",
      "astringent",
    ],
  },
];

/** Resolve a filter key to its raw function tokens; null/unknown → no filter. */
export function tokensForFilter(key: string | null | undefined): string[] | null {
  if (!key) return null;
  return INGREDIENT_FILTERS.find((f) => f.key === key)?.tokens ?? null;
}

/** How many ingredients we load per page. */
export const INGREDIENTS_PAGE_SIZE = 50;
