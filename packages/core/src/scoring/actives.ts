/**
 * Curated active-ingredient taxonomy for match scoring.
 *
 * WHY THIS IS HAND-WRITTEN RATHER THAN READ FROM `ingredients.functions`
 * Only ~30% of catalog ingredients carry INCIDecoder function tags, and the
 * tags are about cosmetic role ("emollient", "soothing") rather than the
 * specific actives safety rules turn on. A pregnancy warning that silently
 * fails to fire because an ingredient row lacked a tag is not acceptable, so
 * every safety-relevant group is matched by name here. Function tags are used
 * separately, as a supplementary breadth signal.
 *
 * Matching is on the normalized INCI name (lowercased, trimmed) — the same
 * form stored in `ingredients.normalized_name`.
 */

export type ActiveGroup =
  | "retinoid"
  | "aha"
  | "bha"
  | "vitamin_c"
  | "brightening"
  | "barrier"
  | "humectant"
  | "soothing"
  | "peptide"
  | "antioxidant"
  | "fragrance"
  | "essential_oil"
  | "drying_alcohol"
  | "physical_scrub"
  | "benzoyl_peroxide"
  | "mattifier"
  | "emollient";

/**
 * Fatty alcohols are emollients, NOT the drying kind. They must never match
 * the drying_alcohol group — "cetearyl alcohol" appearing in a cream is not a
 * reason to warn someone who reacts to alcohol. Checked before that group.
 */
const FATTY_ALCOHOLS = [
  "cetyl alcohol",
  "cetearyl alcohol",
  "stearyl alcohol",
  "behenyl alcohol",
  "myristyl alcohol",
  "lauryl alcohol",
  "arachidyl alcohol",
  "isostearyl alcohol",
  "oleyl alcohol",
  "c12-16 alcohols",
];

/**
 * Each group's patterns are matched against the whole normalized name.
 * Anchored deliberately: "retinal" must not match "retinyl palmitate" twice,
 * and loose substrings would catch unrelated ingredients.
 */
const GROUP_PATTERNS: Record<ActiveGroup, RegExp[]> = {
  // Safety-critical: drives the pregnancy and isotretinoin blocks.
  retinoid: [
    /^retinol$/,
    /^retinal$/,
    /^retinaldehyde$/,
    /^retinyl\s+(palmitate|acetate|propionate|linoleate|retinoate)$/,
    /^hydroxypinacolone\s+retinoate$/,
    /^tretinoin$/,
    /^adapalene$/,
    /^tazarotene$/,
    /\bretinoic\s+acid\b/,
  ],
  // Citric acid is deliberately EXCLUDED — it is overwhelmingly a pH adjuster
  // at trace levels, and counting it as an exfoliating acid would flag most of
  // the catalog.
  aha: [
    /^glycolic\s+acid$/,
    /^lactic\s+acid$/,
    /^mandelic\s+acid$/,
    /^malic\s+acid$/,
    /^tartaric\s+acid$/,
    /^gluconolactone$/,
    /^lactobionic\s+acid$/,
  ],
  bha: [/^salicylic\s+acid$/, /^betaine\s+salicylate$/, /^bha$/],
  vitamin_c: [
    /^ascorbic\s+acid$/,
    /^l-ascorbic\s+acid$/,
    /^3-o-ethyl\s+ascorbic\s+acid$/,
    /^ethyl\s+ascorbic\s+acid$/,
    /^magnesium\s+ascorbyl\s+phosphate$/,
    /^sodium\s+ascorbyl\s+phosphate$/,
    /^ascorbyl\s+glucoside$/,
    /^ascorbyl\s+tetraisopalmitate$/,
    /^tetrahexyldecyl\s+ascorbate$/,
  ],
  brightening: [
    /^niacinamide$/,
    /^alpha[\s-]?arbutin$/,
    /^arbutin$/,
    /^tranexamic\s+acid$/,
    /^azelaic\s+acid$/,
    /^kojic\s+acid$/,
    /^glycyrrhiza\s+glabra/,
    /^licorice/,
  ],
  barrier: [
    /^ceramide\s?(np|ap|eop|ns|as|1|3|6-ii)?$/,
    /^cholesterol$/,
    /^squalane$/,
    /^phytosphingosine$/,
    /^sphingolipids$/,
    /^linoleic\s+acid$/,
  ],
  humectant: [
    /^glycerin$/,
    /^hyaluronic\s+acid$/,
    /^sodium\s+hyaluronate$/,
    /^hydrolyzed\s+hyaluronic\s+acid$/,
    /^sodium\s+pca$/,
    /^betaine$/,
    /^urea$/,
    /^beta[\s-]?glucan$/,
    /^trehalose$/,
    /^panthenol$/,
  ],
  soothing: [
    /^centella\s+asiatica/,
    /^madecassoside$/,
    /^asiaticoside$/,
    /^madecassic\s+acid$/,
    /^asiatic\s+acid$/,
    /^allantoin$/,
    /^bisabolol$/,
    /^avena\s+sativa/,
    /^colloidal\s+oatmeal$/,
    /^camellia\s+sinensis/,
    /^panthenol$/,
    /^snail\s+secretion\s+filtrate$/,
  ],
  peptide: [
    /^palmitoyl\s+/,
    /^acetyl\s+hexapeptide/,
    /^copper\s+tripeptide/,
    /^matrixyl/,
    /\boligopeptide\b/,
    /\bhexapeptide\b/,
    /\btripeptide\b/,
  ],
  antioxidant: [
    /^tocopherol$/,
    /^tocopheryl\s+acetate$/,
    /^ferulic\s+acid$/,
    /^resveratrol$/,
    /^ubiquinone$/,
    /^coenzyme\s+q10$/,
    /^bakuchiol$/,
    /^astaxanthin$/,
  ],
  // Both the EU-labelled allergens and the generic catch-alls.
  fragrance: [
    /^parfum$/,
    /^fragrance$/,
    /^aroma$/,
    /^linalool$/,
    /^limonene$/,
    /^citronellol$/,
    /^geraniol$/,
    /^eugenol$/,
    /^coumarin$/,
    /^citral$/,
    /^benzyl\s+(salicylate|benzoate|alcohol|cinnamate)$/,
    /^hexyl\s+cinnamal$/,
    /^butylphenyl\s+methylpropional$/,
    /^alpha[\s-]?isomethyl\s+ionone$/,
  ],
  essential_oil: [
    /\bessential\s+oil\b/,
    /^lavandula\s+/,
    /^mentha\s+/,
    /^eucalyptus\s+/,
    /^rosmarinus\s+/,
    /^citrus\s+.*\b(peel|fruit)\s+oil\b/,
    /^cananga\s+odorata/,
    /^cymbopogon\s+/,
    /^melaleuca\s+alternifolia/,
    /^pelargonium\s+graveolens/,
  ],
  drying_alcohol: [
    /^alcohol$/,
    /^alcohol\s+denat\.?$/,
    /^denatured\s+alcohol$/,
    /^sd\s+alcohol(\s|$)/,
    /^ethanol$/,
    /^isopropyl\s+alcohol$/,
    /^benzyl\s+alcohol$/,
  ],
  physical_scrub: [
    /\bshell\s+powder\b/,
    /^juglans\s+regia\s+shell/,
    /^prunus\s+armeniaca\s+seed\s+powder$/,
    /^aluminum\s+oxide$/,
    /^silica.*\bbeads?\b/,
  ],
  benzoyl_peroxide: [/^benzoyl\s+peroxide$/],
  mattifier: [
    /^kaolin$/,
    /^bentonite$/,
    /^montmorillonite$/,
    /^charcoal\s+powder$/,
    /^zinc\s+pca$/,
    /^zinc\s+gluconate$/,
    /^silica$/,
    /^starch$/,
    /^rice\s+starch$/,
  ],
  emollient: [
    /^caprylic\/capric\s+triglyceride$/,
    /^shea\s+butter$/,
    /^butyrospermum\s+parkii/,
    /^dimethicone$/,
    /^petrolatum$/,
    /^mineral\s+oil$/,
    /^jojoba\s+(seed\s+)?oil$/,
    /^simmondsia\s+chinensis/,
    /^helianthus\s+annuus\s+seed\s+oil$/,
    /^isopropyl\s+myristate$/,
    /^cetyl\s+alcohol$/,
    /^cetearyl\s+alcohol$/,
    /^stearyl\s+alcohol$/,
  ],
};

/** Which groups an ingredient name belongs to (usually zero or one). */
export function groupsForIngredient(inciName: string): ActiveGroup[] {
  const name = inciName.trim().toLowerCase();
  if (!name) return [];

  // Fatty alcohols are emollients and must never register as "drying alcohol"
  // — but they DO still belong to their other groups, so this suppresses only
  // that one classification rather than short-circuiting entirely.
  const isFattyAlcohol = FATTY_ALCOHOLS.includes(name);

  const groups: ActiveGroup[] = [];
  for (const [group, patterns] of Object.entries(GROUP_PATTERNS)) {
    if (isFattyAlcohol && group === "drying_alcohol") continue;
    if (patterns.some((re) => re.test(name))) groups.push(group as ActiveGroup);
  }
  return groups;
}

/**
 * How much weight an ingredient's presence carries, from its INCI position.
 *
 * INCI order is concentration order, so position is the only concentration
 * signal available without percentages. Niacinamide at #2 is a headline
 * active; at #24 it is a rounding error. Deliberately NOT applied to safety
 * blocks — a trace retinoid still matters to someone who is pregnant.
 */
export function positionWeight(position: number): number {
  if (position <= 5) return 1;
  if (position <= 10) return 0.6;
  if (position <= 20) return 0.3;
  return 0.1;
}
