// basket_check.ts
// ----------------
// Answers: "if I replaced my whole routine with the #1 product in every
// category on /for-you, would that routine be internally compatible?"
//
// It is not, and this script is the demonstration. rankProducts() calls
// scoreProduct() on ONE product at a time and never looks at the others;
// analyzeRoutine() -- the clash engine -- is never called from the ranking
// path, and /for-you contains no reference to compatibility at all. So the
// page answers "is this product right for your skin", never "do these work
// together". Clashes only surface later, once products are saved as a routine.
//
// Run:
//   SB_URL=... SB_KEY=... bun scripts/basket_check.ts

// Would "take the #1 in every category" produce a compatible routine?
import { rankProducts, type SkinProfile, type ScorableProduct } from "@skinsavior/core/scoring";
import { analyzeRoutine, type RoutineStepInput } from "@skinsavior/core/scoring";

const URL = process.env.SB_URL!, KEY = process.env.SB_KEY!;
const q = async (path: string) => {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json() as Promise<any[]>;
};

const CATS = ["cleanser", "toner", "serum", "moisturizer", "sunscreen", "exfoliant", "mask"];

const PROFILES: Record<string, SkinProfile> = {
  "combo / sensitive / pigmentation": {
    skinType: "combination", sensitivity: "sensitive", pigmentation: "moderate",
    agingConcern: "early", pregnancyStatus: "not_pregnant",
    medications: [], reactions: [], currentRoutine: [],
  },
  "dry / resistant / aging": {
    skinType: "dry", sensitivity: "resistant", pigmentation: "none",
    agingConcern: "advanced", pregnancyStatus: "not_pregnant",
    medications: [], reactions: [], currentRoutine: [],
  },
  "oily / resistant / acne": {
    skinType: "oily", sensitivity: "resistant", pigmentation: "mild",
    agingConcern: "none", pregnancyStatus: "not_pregnant",
    medications: [], reactions: [], currentRoutine: [],
  },
};

async function loadCategory(cat: string) {
  const rows = await q(`products?select=id,slug,name,brand,canonical_category&canonical_category=eq.${cat}&excluded_reason=is.null`);
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const byProduct = new Map<string, any[]>();
  for (let off = 0; ; off += 1000) {
    const page = await q(`product_ingredients?select=product_id,position,ingredients(inci_name,functions)&product_id=in.(${ids.join(",")})&order=product_id,position&limit=1000&offset=${off}`);
    for (const j of page) {
      if (!j.ingredients) continue;
      const l = byProduct.get(j.product_id) ?? [];
      l.push({ inciName: j.ingredients.inci_name, position: j.position, functions: j.ingredients.functions });
      byProduct.set(j.product_id, l);
    }
    if (page.length < 1000) break;
  }
  return rows.map((r) => ({ id: r.id, canonicalCategory: r.canonical_category, ingredients: byProduct.get(r.id) ?? [], meta: r }));
}

const cache: Record<string, any[]> = {};
for (const c of CATS) cache[c] = await loadCategory(c);

for (const [label, profile] of Object.entries(PROFILES)) {
  console.log(`\n${"=".repeat(72)}\nPROFILE: ${label}`);
  const steps: RoutineStepInput[] = [];
  for (const cat of CATS) {
    const { ranked } = rankProducts(profile, cache[cat] as ScorableProduct[] & any, { limit: 1 });
    if (!ranked.length) continue;
    const top: any = ranked[0];
    console.log(`  #1 ${cat.padEnd(12)} ${String(top.product.meta.brand).slice(0,18).padEnd(18)} ${String(top.product.meta.name).slice(0,40).padEnd(40)} score ${top.result.score}`);
    steps.push({
      id: top.product.id, label: `${top.product.meta.brand} ${top.product.meta.name}`,
      timeOfDay: "both", category: cat,
      ingredients: top.product.ingredients.map((i: any) => i.inciName),
    });
  }
  const report = analyzeRoutine(steps);
  console.log(`\n  VERDICT: ${report.verdict}   (${report.findings.length} findings)`);
  for (const f of report.findings) {
    console.log(`    [${f.severity.toUpperCase()} · evidence ${f.evidenceTier}] ${f.title}`);
    console.log(`        steps: ${f.steps.join("  +  ")}`);
    console.log(`        ${f.recommendation}`);
  }
}
