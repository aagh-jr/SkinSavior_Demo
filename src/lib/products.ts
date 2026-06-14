export type Product = {
  slug: string;
  name: string;
  brand: string;
  origin: string;
  category: string;
  breadcrumb: string;
  tagline: string;
  description: string;
  price: string;
  retailerCount: number;
  match: number;
  matchFor: string;
  badges: string[];
  forYou: { good: string[]; warn: string[] };
  rank: string;
  evidenceGrade: string;
  evidenceText: string;
  ingredients: { name: string; pct?: string; tags: { label: string; tone: "neutral" | "good" | "warn" }[] }[];
  safety: { label: string; value: string; tone: "good" | "warn" }[];
  retailers: { name: string; price: string; highlight?: boolean }[];
  rating: number;
  reviewCount: number;
  reviews: { author: string; profile: string; stars: string; text: string; color: string }[];
};

export const products: Product[] = [
  {
    slug: "serum",
    name: "Radiance Vitamin C Serum",
    brand: "GLOWLAB",
    origin: "France",
    category: "Serum",
    breadcrumb: "Products / Serums / Brightening",
    tagline: "Brightening serum",
    description:
      "A stabilized 15% L-ascorbic acid serum paired with ferulic acid and vitamin E — the textbook antioxidant trio for fading post-acne marks and evening tone without irritating sensitive skin.",
    price: "$32.00",
    retailerCount: 4,
    match: 91,
    matchFor: "Combo · Brightening · Fragrance-free",
    badges: ["✓ Cosmetic — not a drug", "✓ Vegan", "✓ Fragrance-free", "✓ Cruelty-free"],
    forYou: {
      good: [
        "✓ Targets your dark spots & uneven tone",
        "✓ Fragrance-free — fits your sensitivity flag",
        "✓ Layers cleanly under SPF",
      ],
      warn: ["⚠ Active vitamin C — introduce slowly if reactive"],
    },
    rank: "Ranks above 82% of serums for your profile.",
    evidenceGrade: "A−",
    evidenceText:
      "Brightening & antioxidant benefits supported by 11 human trials. Strong evidence for the 15% L-ascorbic + ferulic combination at pH < 3.5.",
    ingredients: [
      { name: "L-Ascorbic Acid", pct: "15%", tags: [{ label: "Antioxidant", tone: "neutral" }, { label: "★ Key active", tone: "good" }] },
      { name: "Ferulic Acid", tags: [{ label: "Antioxidant", tone: "neutral" }] },
      { name: "Tocopherol (Vitamin E)", tags: [{ label: "Antioxidant", tone: "neutral" }] },
      { name: "Sodium Hyaluronate", tags: [{ label: "Humectant", tone: "neutral" }] },
      { name: "Propylene Glycol", tags: [{ label: "Solvent", tone: "neutral" }] },
      { name: "Phenoxyethanol", tags: [{ label: "Preservative", tone: "neutral" }, { label: "⚠ Sensitive skin", tone: "warn" }] },
    ],
    safety: [
      { label: "Pregnancy & breastfeeding", value: "✓ Safe", tone: "good" },
      { label: "Fungal-acne (malassezia)", value: "✓ Safe", tone: "good" },
      { label: "Added fragrance", value: "✓ None", tone: "good" },
      { label: "Common allergens", value: "⚠ 1 to note", tone: "warn" },
    ],
    retailers: [
      { name: "Sephora", price: "$32.00", highlight: true },
      { name: "Ulta", price: "$34.00" },
      { name: "Amazon", price: "$36.50" },
      { name: "Dermstore", price: "$38.00" },
    ],
    rating: 4.6,
    reviewCount: 8420,
    reviews: [
      {
        author: "ava_t",
        profile: "Combo / Dark spots",
        stars: "★★★★★",
        text: "Six weeks in and my old acne marks have visibly faded. No stinging — and it plays nicely with my retinol on alternate nights.",
        color: "#caa37f",
      },
      {
        author: "skin_nerd",
        profile: "Sensitive / Redness-prone",
        stars: "★★★★☆",
        text: "Brighter and more even in a month. Slight tingle on day one, gone by day three.",
        color: "#a8b89a",
      },
    ],
  },
  {
    slug: "toner",
    name: "Calming Centella Toner",
    brand: "PURELEAF",
    origin: "South Korea",
    category: "Toner",
    breadcrumb: "Products / Toners / Soothing",
    tagline: "Soothing toner",
    description:
      "A near-water-light toner built around 80% Centella asiatica extract — the gold-standard botanical for quieting redness, calming reactive skin, and prepping the barrier for serums.",
    price: "$14.50",
    retailerCount: 3,
    match: 88,
    matchFor: "Sensitive · Redness · Fragrance-free",
    badges: ["✓ Cosmetic — not a drug", "✓ Pregnancy-safe", "✓ Fragrance-free", "✓ Alcohol-free"],
    forYou: {
      good: [
        "✓ Centella for your redness & reactivity",
        "✓ No alcohol, no fragrance",
        "✓ Compatible with active serums",
      ],
      warn: [],
    },
    rank: "Ranks above 79% of toners for your profile.",
    evidenceGrade: "B+",
    evidenceText:
      "Soothing & barrier support backed by 9 human trials on Centella-derived asiaticosides. Strong sensory benefit, modest objective barrier repair.",
    ingredients: [
      { name: "Centella Asiatica Extract", pct: "80%", tags: [{ label: "Soothing", tone: "good" }, { label: "★ Key active", tone: "good" }] },
      { name: "Madecassoside", tags: [{ label: "Soothing", tone: "good" }] },
      { name: "Panthenol", tags: [{ label: "Soothing", tone: "good" }] },
      { name: "Glycerin", tags: [{ label: "Humectant", tone: "neutral" }] },
      { name: "1,2-Hexanediol", tags: [{ label: "Preservative", tone: "neutral" }] },
    ],
    safety: [
      { label: "Pregnancy & breastfeeding", value: "✓ Safe", tone: "good" },
      { label: "Fungal-acne (malassezia)", value: "✓ Safe", tone: "good" },
      { label: "Added fragrance", value: "✓ None", tone: "good" },
      { label: "Common allergens", value: "✓ None flagged", tone: "good" },
    ],
    retailers: [
      { name: "YesStyle", price: "$14.50", highlight: true },
      { name: "Olive Young", price: "$15.20" },
      { name: "Amazon", price: "$18.00" },
    ],
    rating: 4.8,
    reviewCount: 6210,
    reviews: [
      {
        author: "rosie_p",
        profile: "Sensitive / Rosacea-prone",
        stars: "★★★★★",
        text: "The only toner that doesn't set my cheeks on fire. Redness drops within a week.",
        color: "#caa37f",
      },
      {
        author: "jay.derm",
        profile: "Combo / Reactive",
        stars: "★★★★★",
        text: "Watery but it sinks in fast and lets my serums layer without pilling.",
        color: "#a8b89a",
      },
    ],
  },
  {
    slug: "cream",
    name: "Barrier Restore Cream",
    brand: "DERMAQUIET",
    origin: "Japan",
    category: "Moisturizer",
    breadcrumb: "Products / Moisturizers / Barrier repair",
    tagline: "Barrier repair cream",
    description:
      "A ceramide-dense moisturizer in a classic 3:1:1 ceramide–cholesterol–fatty acid ratio — the formulation pattern dermatologists reach for when a skin barrier is visibly compromised.",
    price: "$24.00",
    retailerCount: 5,
    match: 96,
    matchFor: "Dry · Sensitive · Barrier-compromised",
    badges: ["✓ Cosmetic — not a drug", "✓ Pregnancy-safe", "✓ Fragrance-free", "✓ Non-comedogenic"],
    forYou: {
      good: [
        "✓ Ceramide 3:1:1 ratio for your dryness",
        "✓ Fragrance-free — fits your sensitivity flag",
        "✓ Occlusive enough for overnight repair",
      ],
      warn: ["⚠ Contains shea butter — fine for most, watch if fungal-acne-prone"],
    },
    rank: "Ranks above 92% of moisturizers for your profile.",
    evidenceGrade: "A",
    evidenceText:
      "Barrier repair very well-supported: 14 human trials on physiological-ratio ceramide creams show measurable TEWL reduction within 2 weeks.",
    ingredients: [
      { name: "Ceramide NP", tags: [{ label: "Barrier lipid", tone: "good" }, { label: "★ Key active", tone: "good" }] },
      { name: "Ceramide AP", tags: [{ label: "Barrier lipid", tone: "good" }] },
      { name: "Cholesterol", tags: [{ label: "Barrier lipid", tone: "good" }] },
      { name: "Squalane", tags: [{ label: "Emollient", tone: "neutral" }] },
      { name: "Shea Butter", tags: [{ label: "Emollient", tone: "neutral" }, { label: "⚠ Fungal-acne", tone: "warn" }] },
      { name: "Niacinamide", tags: [{ label: "Brightening", tone: "good" }] },
      { name: "Phenoxyethanol", tags: [{ label: "Preservative", tone: "neutral" }] },
    ],
    safety: [
      { label: "Pregnancy & breastfeeding", value: "✓ Safe", tone: "good" },
      { label: "Fungal-acne (malassezia)", value: "⚠ Watch", tone: "warn" },
      { label: "Added fragrance", value: "✓ None", tone: "good" },
      { label: "Common allergens", value: "✓ None flagged", tone: "good" },
    ],
    retailers: [
      { name: "Sephora", price: "$24.00", highlight: true },
      { name: "Amazon", price: "$26.00" },
      { name: "iHerb", price: "$22.50" },
      { name: "Dermstore", price: "$28.00" },
      { name: "Ulta", price: "$27.00" },
    ],
    rating: 4.9,
    reviewCount: 15240,
    reviews: [
      {
        author: "mina_k",
        profile: "Dry / Sensitive",
        stars: "★★★★★",
        text: "My winter eczema patches calmed down in five nights. Heavy but never greasy by morning.",
        color: "#caa37f",
      },
      {
        author: "derm_curious",
        profile: "Combo / Barrier-compromised",
        stars: "★★★★★",
        text: "The ceramide ratio actually does what it says. I stopped flaking around my nose within a week.",
        color: "#a8b89a",
      },
    ],
  },
];

export function searchProducts(q: string): Product[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  return products.filter((p) => {
    const hay = [
      p.name,
      p.brand,
      p.category,
      p.tagline,
      p.description,
      ...p.ingredients.map((i) => i.name),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(needle);
  });
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
