// Static ingredients library. Shared by the /ingredients page and the SearchBar
// ingredient toggle. (No ingredient DB/search backend yet — this is the source
// of truth for now.)

export interface Ingredient {
  slug: string;
  name: string;
  tag: string;
  blurb: string;
  grade: string;
}

export const INGREDIENTS: Ingredient[] = [
  {
    slug: "niacinamide",
    name: "Niacinamide",
    tag: "Brightening · Barrier",
    blurb:
      "A form of vitamin B3 that calms redness, supports the barrier, and visibly evens tone over 8–12 weeks at 2–5%.",
    grade: "A",
  },
  {
    slug: "vitamin-c",
    name: "Vitamin C (L-Ascorbic Acid)",
    tag: "Antioxidant · Brightening",
    blurb:
      "Neutralizes daytime free radicals and fades hyperpigmentation. Best at 10–20% with a low pH — stable formulas matter.",
    grade: "A",
  },
  {
    slug: "retinol",
    name: "Retinol",
    tag: "Renewal · Anti-aging",
    blurb:
      "The most studied anti-aging ingredient. Speeds turnover, improves fine lines and texture. Start low, build slowly.",
    grade: "A",
  },
  {
    slug: "salicylic-acid",
    name: "Salicylic Acid",
    tag: "Acne · Pores",
    blurb:
      "Oil-soluble BHA that clears congestion inside pores. Excellent for combination and oily skin at 0.5–2%.",
    grade: "A",
  },
  {
    slug: "centella-asiatica",
    name: "Centella Asiatica",
    tag: "Calming · Sensitive",
    blurb:
      "A botanical with real clinical data for reducing redness and supporting wound healing. Great for reactive skin.",
    grade: "B",
  },
  {
    slug: "hyaluronic-acid",
    name: "Hyaluronic Acid",
    tag: "Hydration",
    blurb:
      "A humectant that holds water in the upper skin layers. Layer onto damp skin and seal with a moisturizer.",
    grade: "B",
  },
];

/** Case-insensitive match over ingredient name and tag. Empty query → all. */
export function searchIngredients(query: string): Ingredient[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return INGREDIENTS;
  return INGREDIENTS.filter(
    (i) =>
      i.name.toLowerCase().includes(needle) ||
      i.tag.toLowerCase().includes(needle),
  );
}
