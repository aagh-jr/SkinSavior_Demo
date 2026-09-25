/**
 * Fake ingredient rows for Storybook, typed against the real IngredientRow
 * contract. Common actives plus one row with no evidence/description data
 * (the empty state the ingredient pages must handle gracefully).
 */
import type { IngredientRow, IngredientPage } from "@skinsavior/core/types";

export const niacinamide: IngredientRow = {
  id: "ing-niacinamide",
  inci_name: "Niacinamide",
  common_name: "Vitamin B3",
  functions: ["skin conditioning", "smoothing"],
  description:
    "A form of vitamin B3 used widely in serums and moisturizers. Studied for oil control, pore appearance and the look of uneven tone; generally well tolerated across skin types.",
  safety_notes: "No known pregnancy concern. Very low irritation potential.",
};

export const retinol: IngredientRow = {
  id: "ing-retinol",
  inci_name: "Retinol",
  common_name: "Vitamin A",
  functions: ["skin conditioning"],
  description:
    "A vitamin A derivative used in evening products for the look of fine lines and texture. Introduce slowly and pair with daytime sun protection.",
  safety_notes: "Avoid during pregnancy. Can increase sun sensitivity — use SPF.",
};

export const salicylicAcid: IngredientRow = {
  id: "ing-salicylic-acid",
  inci_name: "Salicylic Acid",
  common_name: "BHA",
  functions: ["exfoliant"],
  description:
    "An oil-soluble beta-hydroxy acid that exfoliates inside the pore. Common in leave-on toners for congestion and rough texture.",
  safety_notes: "Discuss high-strength use during pregnancy with your provider.",
};

export const vitaminC: IngredientRow = {
  id: "ing-ascorbic-acid",
  inci_name: "Ascorbic Acid",
  common_name: "Vitamin C",
  functions: ["antioxidant"],
  description:
    "The most-studied form of topical vitamin C. Used in daytime antioxidant serums; best kept in stable, low-pH formulas.",
  safety_notes: "No known pregnancy concern. May sting freshly-exfoliated skin.",
};

export const hyaluronicAcid: IngredientRow = {
  id: "ing-sodium-hyaluronate",
  inci_name: "Sodium Hyaluronate",
  common_name: "Hyaluronic Acid",
  functions: ["humectant"],
  description:
    "A humectant that draws water into the upper layers of skin for an immediately more hydrated look and feel.",
  safety_notes: "No known concerns.",
};

export const ceramides: IngredientRow = {
  id: "ing-ceramide-np",
  inci_name: "Ceramide NP",
  common_name: "Ceramide",
  functions: ["skin conditioning", "barrier"],
  description:
    "A skin-identical lipid used to support the moisture barrier. Frequently paired with cholesterol and fatty acids.",
  safety_notes: "No known concerns.",
};

/** Empty-data case: no common name, no functions, no description or safety. */
export const unknownIngredient: IngredientRow = {
  id: "ing-unknown-1",
  inci_name: "Capryloyl Salicylic Acid",
  common_name: null,
  functions: null,
  description: null,
  safety_notes: null,
};

export const ingredients: IngredientRow[] = [
  niacinamide,
  retinol,
  salicylicAcid,
  vitaminC,
  hyaluronicAcid,
  ceramides,
  unknownIngredient,
];

export const ingredientsPage: IngredientPage = {
  rows: ingredients,
  total: ingredients.length,
  hasMore: false,
};

export const emptyIngredientsPage: IngredientPage = {
  rows: [],
  total: 0,
  hasMore: false,
};
