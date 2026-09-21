/**
 * Fake products for Storybook. Typed against the real @skinsavior/core
 * contract so these break loudly if the domain shape changes.
 *
 * Follows the product principles in AGENTS.md: evidence framing is believable
 * (never exaggerated), and nothing here makes a disease-treatment claim.
 * Images are null (components fall back to the category icon) or a local
 * inline placeholder — never a hotlinked outside image.
 */
import type {
  Product,
  ProductIngredient,
  ProductCardRow,
  ProductsPage,
  ProductCategory,
  ShelfProduct,
} from "@skinsavior/core/types";

/** A neutral inline placeholder so a card can show "a photo" with no network. */
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#EDEFF3"/><text x="200" y="210" font-family="sans-serif" font-size="20" fill="#8A94A6" text-anchor="middle">product photo</text></svg>`,
  );

const ing = (name: string, pct: string, tags: ProductIngredient["tags"] = []) => ({
  name,
  pct,
  tags,
});

/** Sensible defaults so each fixture only spells out what makes it distinct. */
function makeProduct(over: Partial<Product> & Pick<Product, "slug" | "name" | "brand" | "category">): Product {
  return {
    origin: "USA",
    imageUrl: PLACEHOLDER_IMAGE,
    breadcrumb: `${over.brand} · ${over.name}`,
    tagline: "A well-formulated everyday staple.",
    description:
      "A straightforward formula with a short, legible ingredient list. Full INCI shown below.",
    price: "$18",
    retailerCount: 3,
    match: 82,
    matchFor: "combination skin",
    badges: [],
    forYou: { good: [], warn: [] },
    rank: "#4 in category",
    evidenceGrade: "Moderate evidence",
    evidenceText: "Key actives have moderate-certainty support for their cosmetic claims.",
    ingredients: [],
    safety: [],
    retailers: [
      { name: "Brand store", price: "$18", highlight: true },
      { name: "Retailer A", price: "$19" },
      { name: "Retailer B", price: "$20" },
    ],
    rating: 4.4,
    reviewCount: 128,
    reviews: [
      {
        author: "Maya R.",
        profile: "Combination · sensitive",
        stars: "★★★★★",
        text: "Lightweight, no sting, layers well under sunscreen.",
        color: "#2F6FED",
      },
    ],
    ...over,
  };
}

export const niacinamideSerum = makeProduct({
  slug: "the-ordinary-niacinamide-10-zinc-1",
  name: "Niacinamide 10% + Zinc 1%",
  brand: "The Ordinary",
  origin: "Canada",
  category: "Serum",
  tagline: "High-strength oil and blemish-look regulator.",
  price: "$6",
  match: 91,
  matchFor: "oily, blemish-prone skin",
  badges: ["Controls oil", "Minimizes pores"],
  forYou: {
    good: ["Niacinamide at #2 — a headline active for oil control", "Fragrance-free"],
    warn: [],
  },
  rank: "#1 in serums",
  evidenceGrade: "Strong evidence",
  evidenceText:
    "Niacinamide has strong-certainty support for oil control and pore appearance.",
  ingredients: [
    ing("Aqua", "~80%"),
    ing("Niacinamide", "10%", [{ label: "Controls oil", tone: "good" }]),
    ing("Zinc PCA", "1%", [{ label: "Soothes", tone: "good" }]),
    ing("Pentylene Glycol", "—"),
    ing("Phenoxyethanol", "—", [{ label: "Preservative", tone: "neutral" }]),
  ],
  safety: [
    { label: "Pregnancy", value: "No known concern", tone: "good" },
    { label: "Fragrance", value: "Fragrance-free", tone: "good" },
  ],
  rating: 4.5,
  reviewCount: 4210,
});

export const vitaminCSerum = makeProduct({
  slug: "skinceuticals-ce-ferulic",
  name: "C E Ferulic",
  brand: "SkinCeuticals",
  category: "Serum",
  tagline: "Antioxidant day serum with 15% L-ascorbic acid.",
  price: "$182",
  match: 88,
  matchFor: "normal skin wanting antioxidant support",
  badges: ["Antioxidant", "Brightens"],
  forYou: {
    good: ["Vitamin C at #1 — antioxidant support", "Vitamin E + ferulic acid stabilize it"],
    warn: ["Low pH may sting freshly-exfoliated skin"],
  },
  rank: "#2 in serums",
  evidenceGrade: "Moderate evidence",
  ingredients: [
    ing("Aqua", "—"),
    ing("Ascorbic Acid", "15%", [{ label: "Antioxidant", tone: "good" }]),
    ing("Ethoxydiglycol", "—"),
    ing("Tocopherol", "1%", [{ label: "Antioxidant", tone: "good" }]),
    ing("Ferulic Acid", "0.5%", [{ label: "Antioxidant", tone: "good" }]),
  ],
  safety: [
    { label: "Pregnancy", value: "No known concern", tone: "good" },
    { label: "Fragrance", value: "Fragrance-free", tone: "good" },
  ],
  rating: 4.6,
  reviewCount: 980,
});

export const gentleCleanser = makeProduct({
  slug: "cerave-hydrating-cleanser",
  name: "Hydrating Facial Cleanser",
  brand: "CeraVe",
  category: "Cleanser",
  tagline: "Non-foaming cleanser with ceramides and hyaluronic acid.",
  price: "$16",
  match: 79,
  matchFor: "dry, sensitive skin",
  badges: ["Supports barrier", "Fragrance-free"],
  forYou: {
    good: ["Ceramides + hyaluronic acid", "No sulfates, no fragrance"],
    warn: [],
  },
  rank: "#3 in cleansers",
  evidenceGrade: "Moderate evidence",
  ingredients: [
    ing("Aqua", "—"),
    ing("Glycerin", "—", [{ label: "Hydrates", tone: "good" }]),
    ing("Ceramide NP", "—", [{ label: "Supports barrier", tone: "good" }]),
    ing("Hyaluronic Acid", "—", [{ label: "Hydrates", tone: "good" }]),
  ],
  safety: [{ label: "Fragrance", value: "Fragrance-free", tone: "good" }],
  rating: 4.5,
  reviewCount: 3120,
});

export const ceramideMoisturizer = makeProduct({
  slug: "cerave-moisturizing-cream",
  name: "Moisturizing Cream",
  brand: "CeraVe",
  category: "Moisturizer",
  tagline: "Rich barrier cream with three essential ceramides.",
  price: "$19",
  match: 84,
  matchFor: "dry skin",
  badges: ["Supports barrier", "Hydrates"],
  forYou: { good: ["Ceramides + cholesterol", "Fragrance-free"], warn: [] },
  rank: "#1 in moisturizers",
  evidenceGrade: "Moderate evidence",
  ingredients: [
    ing("Aqua", "—"),
    ing("Glycerin", "—", [{ label: "Hydrates", tone: "good" }]),
    ing("Cetearyl Alcohol", "—"),
    ing("Ceramide NP", "—", [{ label: "Supports barrier", tone: "good" }]),
    ing("Cholesterol", "—", [{ label: "Supports barrier", tone: "good" }]),
  ],
  safety: [{ label: "Fragrance", value: "Fragrance-free", tone: "good" }],
  rating: 4.7,
  reviewCount: 5400,
});

export const mineralSunscreen = makeProduct({
  slug: "eltamd-uv-clear-spf-46",
  name: "UV Clear Broad-Spectrum SPF 46",
  brand: "EltaMD",
  category: "Sunscreen",
  tagline: "Lightweight mineral-forward sunscreen with niacinamide.",
  price: "$41",
  match: 90,
  matchFor: "sensitive, blemish-prone skin",
  badges: ["Broad spectrum", "Fragrance-free"],
  forYou: { good: ["Zinc oxide 9%", "Niacinamide for oil control"], warn: [] },
  rank: "#1 in sunscreens",
  evidenceGrade: "Strong evidence",
  ingredients: [
    ing("Zinc Oxide", "9%", [{ label: "Broad spectrum", tone: "good" }]),
    ing("Octinoxate", "7.5%"),
    ing("Niacinamide", "—", [{ label: "Controls oil", tone: "good" }]),
    ing("Aqua", "—"),
  ],
  safety: [
    { label: "SPF", value: "SPF 46 broad spectrum", tone: "good" },
    { label: "Fragrance", value: "Fragrance-free", tone: "good" },
  ],
  rating: 4.6,
  reviewCount: 2210,
});

export const bhaToner = makeProduct({
  slug: "paulas-choice-2-bha-liquid-exfoliant",
  name: "Skin Perfecting 2% BHA Liquid Exfoliant",
  brand: "Paula's Choice",
  category: "Toner",
  tagline: "Leave-on salicylic acid exfoliant for pores and texture.",
  price: "$35",
  match: 80,
  matchFor: "oily, congested skin",
  badges: ["Smooths texture", "Minimizes pores"],
  forYou: {
    good: ["Salicylic acid 2% — well-studied BHA"],
    warn: ["Don't stack with a retinoid on the same night"],
  },
  rank: "#2 in toners",
  evidenceGrade: "Strong evidence",
  ingredients: [
    ing("Aqua", "—"),
    ing("Methylpropanediol", "—"),
    ing("Salicylic Acid", "2%", [{ label: "Smooths texture", tone: "good" }]),
    ing("Butylene Glycol", "—"),
  ],
  safety: [
    { label: "Pregnancy", value: "Discuss BHA with your provider", tone: "warn" },
    { label: "Fragrance", value: "Fragrance-free", tone: "good" },
  ],
  rating: 4.4,
  reviewCount: 1870,
});

export const retinoidSerum = makeProduct({
  slug: "the-ordinary-retinal-0-2",
  name: "Retinal 0.2% Emulsion",
  brand: "The Ordinary",
  origin: "Canada",
  category: "Serum",
  tagline: "Mid-strength retinaldehyde for evening use.",
  price: "$10",
  match: 76,
  matchFor: "experienced users, evening routine",
  badges: ["Smooths wrinkles"],
  forYou: {
    good: ["Retinaldehyde — a well-studied retinoid"],
    warn: ["PM only, pair with SPF the next morning"],
  },
  rank: "#6 in serums",
  evidenceGrade: "Moderate evidence",
  // A retinoid carries a real pregnancy block even in trace amounts.
  ingredients: [
    ing("Aqua", "—"),
    ing("Retinal", "0.2%", [{ label: "Smooths wrinkles", tone: "good" }]),
    ing("Squalane", "—", [{ label: "Hydrates", tone: "good" }]),
    ing("Phenoxyethanol", "—", [{ label: "Preservative", tone: "neutral" }]),
  ],
  safety: [
    { label: "Pregnancy", value: "Avoid during pregnancy", tone: "warn" },
    { label: "Sun sensitivity", value: "Use SPF the next morning", tone: "warn" },
  ],
  rating: 4.3,
  reviewCount: 640,
});

/** Missing-optional-fields case: no image, no reviews, empty ingredient tags. */
export const sparseProduct = makeProduct({
  slug: "generic-hyaluronic-serum",
  name: "Hyaluronic Acid Serum",
  brand: "Local Brand",
  category: "Serum",
  imageUrl: null,
  tagline: "A simple hydrating serum.",
  price: "$12",
  match: 70,
  matchFor: "any skin type",
  badges: [],
  forYou: { good: ["Hydrates"], warn: [] },
  rank: "#12 in serums",
  evidenceGrade: "Limited evidence",
  ingredients: [ing("Aqua", "—"), ing("Sodium Hyaluronate", "1%")],
  safety: [],
  retailers: [],
  retailerCount: 0,
  rating: 0,
  reviewCount: 0,
  reviews: [],
});

/** Long-name case: checks card/heading truncation and wrapping. */
export const longNameProduct = makeProduct({
  slug: "brand-extremely-long-name",
  name: "Ultra-Restorative Intensive Overnight Barrier Repair Concentrate with Ceramides, Peptides & Squalane",
  brand: "A Rather Long Skincare Brand Name Co.",
  category: "Moisturizer",
  tagline:
    "A deliberately long product name and tagline to check how headings, cards and breadcrumbs handle overflow without breaking the layout.",
  price: "$120",
  match: 68,
  matchFor: "dry, mature skin looking for overnight barrier support",
  badges: ["Supports barrier", "Hydrates", "Smooths wrinkles"],
  forYou: {
    good: ["Ceramides", "Peptides", "Squalane"],
    warn: ["Rich texture may feel heavy on oily skin"],
  },
  rank: "#9 in moisturizers",
  evidenceGrade: "Limited evidence",
  ingredients: [
    ing("Aqua", "—"),
    ing("Squalane", "—", [{ label: "Hydrates", tone: "good" }]),
    ing("Ceramide NP", "—", [{ label: "Supports barrier", tone: "good" }]),
  ],
  rating: 4.1,
  reviewCount: 42,
});

/** All fixture products, spanning cleanser, serum, moisturizer, sunscreen, toner. */
export const products: Product[] = [
  niacinamideSerum,
  vitaminCSerum,
  gentleCleanser,
  ceramideMoisturizer,
  mineralSunscreen,
  bhaToner,
  retinoidSerum,
  sparseProduct,
  longNameProduct,
];

/** Snake_case catalog card rows (the shape products-db returns). */
export const productCardRows: ProductCardRow[] = products.map((p) => ({
  slug: p.slug,
  name: p.name,
  brand: p.brand,
  origin: p.origin,
  category: p.category,
  price: p.price,
  image_url: p.imageUrl ?? null,
}));

/** One page of catalog cards. */
export const productsPage: ProductsPage = {
  rows: productCardRows,
  total: productCardRows.length,
  hasMore: false,
};

export const emptyProductsPage: ProductsPage = { rows: [], total: 0, hasMore: false };

/** Browse-filter category chips for the products explorer. */
export const productCategories: ProductCategory[] = [
  { key: "cleanser", label: "Cleansers", rawValues: ["Cleanser"], count: 1 },
  { key: "serum", label: "Serums", rawValues: ["Serum"], count: 4 },
  { key: "moisturizer", label: "Moisturizers", rawValues: ["Moisturizer"], count: 2 },
  { key: "sunscreen", label: "Sunscreens", rawValues: ["Sunscreen"], count: 1 },
  { key: "toner", label: "Toners", rawValues: ["Toner"], count: 1 },
];

/** "My shelf" rows: some in-use (in routines), some saved-only. */
export const shelfProducts: ShelfProduct[] = [
  {
    productId: "prod-niacinamide",
    slug: niacinamideSerum.slug,
    name: niacinamideSerum.name,
    brand: niacinamideSerum.brand,
    imageUrl: niacinamideSerum.imageUrl ?? null,
    category: niacinamideSerum.category,
    usedIn: ["Morning routine"],
    savedAt: "2026-05-03T12:00:00.000Z",
    note: "Cut my midday shine noticeably.",
  },
  {
    productId: "prod-sunscreen",
    slug: mineralSunscreen.slug,
    name: mineralSunscreen.name,
    brand: mineralSunscreen.brand,
    imageUrl: mineralSunscreen.imageUrl ?? null,
    category: mineralSunscreen.category,
    usedIn: ["Morning routine"],
    savedAt: null,
    note: null,
  },
  {
    productId: "prod-cleanser",
    slug: gentleCleanser.slug,
    name: gentleCleanser.name,
    brand: gentleCleanser.brand,
    imageUrl: null,
    category: gentleCleanser.category,
    usedIn: [],
    savedAt: "2026-06-01T09:00:00.000Z",
    note: null,
  },
];

export const savedOnlyShelfProducts: ShelfProduct[] = shelfProducts.filter(
  (p) => p.usedIn.length === 0,
);

