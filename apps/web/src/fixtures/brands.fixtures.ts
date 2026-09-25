/**
 * Fake brand-index rows for Storybook, typed against BrandSummary.
 */
import type { BrandSummary } from "@skinsavior/core/types";

export const brands: BrandSummary[] = [
  {
    slug: "cerave",
    name: "CeraVe",
    origin: "USA",
    productCount: 24,
    categories: ["Cleanser", "Moisturizer", "Sunscreen"],
    sampleImage: null,
  },
  {
    slug: "the-ordinary",
    name: "The Ordinary",
    origin: "Canada",
    productCount: 61,
    categories: ["Serum", "Toner", "Moisturizer"],
    sampleImage: null,
  },
  {
    slug: "paulas-choice",
    name: "Paula's Choice",
    origin: "USA",
    productCount: 38,
    categories: ["Toner", "Serum"],
    sampleImage: null,
  },
  {
    slug: "dear-klairs",
    name: "Dear, Klairs",
    origin: "South Korea",
    productCount: 12,
    categories: ["Toner", "Essence"],
    sampleImage: null,
  },
  {
    slug: "eltamd",
    name: "EltaMD",
    origin: "USA",
    productCount: 9,
    categories: ["Sunscreen"],
    sampleImage: null,
  },
];

/** Grouped by first letter for the A-Z index sections. */
export const brandsByLetter: Record<string, BrandSummary[]> = brands.reduce(
  (acc, b) => {
    const letter = b.name[0].toUpperCase();
    (acc[letter] ??= []).push(b);
    return acc;
  },
  {} as Record<string, BrandSummary[]>,
);

export const ALPHABET = [
  "#",
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
];

export const activeLetters = new Set(Object.keys(brandsByLetter));
