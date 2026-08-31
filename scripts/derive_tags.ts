// derive_tags.ts
// --------------
// Computes product tags from the INGREDIENT LIST, not from brand marketing.
//
// WHY DERIVED, NOT SCRAPED
// Shopify serves rich-looking facets on every product -- 'without_ingredient::
// Fragrance', 'skin_type::Oily', 'benefit::Hydration' -- and it is tempting to
// store them directly. Don't. Those are claims a brand makes about itself, in
// its own vocabulary, with no shared definition and nothing checking them.
// Today's categorisation bug came from exactly that source: a moisturizer
// ranked #1 in Sunscreens because of a 'free mini spf w/moisturizer' promo tag,
// and 'NO CHEMICAL SUNSCREEN' -- a claim the product contains none -- read as
// evidence it did.
//
// The INCI list is different in kind: it is a regulated disclosure, we already
// store it, and we verified it against the source. A tag computed from it is
// something we can show our work for, which is the whole promise of the index.
//
// It runs in TypeScript rather than alongside the Python pipeline so it can use
// groupsForIngredient() from actives.ts directly. That taxonomy is safety-
// critical and hand-curated; a second copy in Python would drift, and the copy
// that drifted would be the one deciding whether to warn someone.
//
// WHAT A "FREE-FROM" TAG MEANS HERE
// Absence of evidence, and we only claim it when we actually looked. A product
// gets `fragrance-free` when we hold its INCI list and no ingredient in it maps
// to the fragrance group. Products with no INCI get NO tags at all rather than
// a full set of reassuring free-from claims -- "we don't know" must not render
// as "it's clean".
//
// Run:
//   SB_URL=... SB_KEY=<service_role> bun scripts/derive_tags.ts          # report
//   SB_URL=... SB_KEY=<service_role> bun scripts/derive_tags.ts --write

import { groupsForIngredient, type ActiveGroup } from "@skinsavior/core/scoring";

const URL = process.env.SB_URL!;
const KEY = process.env.SB_KEY!;
const WRITE = process.argv.includes("--write");

if (!URL || !KEY) {
  console.error("Set SB_URL and SB_KEY (service_role) in the environment.");
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function rest(path: string, init?: RequestInit) {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...H, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

/** PostgREST caps every response at 1000 rows — page or lose the tail. */
async function fetchAll(select: string): Promise<any[]> {
  const out: any[] = [];
  for (let offset = 0; ; offset += 1000) {
    const page = (await rest(`${select}&limit=1000&offset=${offset}`)) as any[];
    out.push(...page);
    if (page.length < 1000) break;
  }
  return out;
}

// "Contains" tags: the group is present at all. Position is deliberately
// ignored — someone filtering for niacinamide wants to find it, and whether
// it is at #2 or #20 is what the score is for.
const CONTAINS: Partial<Record<ActiveGroup, string>> = {
  retinoid: "retinoid",
  aha: "aha",
  bha: "bha",
  vitamin_c: "vitamin-c",
  peptide: "peptides",
  barrier: "ceramides",
  humectant: "hydrating",
  soothing: "soothing",
  antioxidant: "antioxidants",
  brightening: "brightening",
  benzoyl_peroxide: "benzoyl-peroxide",
  physical_scrub: "physical-scrub",
};

// "Free-from" tags: the group is absent from a list we actually hold.
const FREE_FROM: Partial<Record<ActiveGroup, string>> = {
  fragrance: "fragrance-free",
  essential_oil: "essential-oil-free",
  drying_alcohol: "alcohol-free",
};

function splitInci(raw: string): string[] {
  return raw
    .split(/[,•;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function tagsFor(raw: string): string[] {
  const names = splitInci(raw);
  if (names.length < 3) return []; // too short to trust as a real INCI list
  const present = new Set<ActiveGroup>();
  for (const n of names) for (const g of groupsForIngredient(n)) present.add(g);

  const tags: string[] = [];
  for (const [group, tag] of Object.entries(CONTAINS)) {
    if (present.has(group as ActiveGroup)) tags.push(tag!);
  }
  for (const [group, tag] of Object.entries(FREE_FROM)) {
    if (!present.has(group as ActiveGroup)) tags.push(tag!);
  }
  // Surfaced as a filter because it is the single most common reason someone
  // needs to exclude a product outright. The scorer still blocks independently
  // — this is for browsing, never the safety path.
  if (present.has("retinoid")) tags.push("avoid-in-pregnancy");
  return [...new Set(tags)].sort();
}

// Report before the migration is applied: `tags` may not exist yet, and a
// missing column is a 42703, not an empty result. Fall back so the numbers can
// be reviewed before anyone runs DDL.
let hasTagsColumn = true;
let rows: any[];
try {
  rows = await fetchAll("products?select=id,brand,name,raw_ingredients,tags,excluded_reason");
} catch (e) {
  if (!String(e).includes("42703")) throw e;
  hasTagsColumn = false;
  rows = await fetchAll("products?select=id,brand,name,raw_ingredients,excluded_reason");
  console.log("NOTE: products.tags does not exist yet - apply");
  console.log("      supabase/migrations/20260823000000_product_tags.sql first.");
}
const visible = rows.filter((r) => !r.excluded_reason);
const scoreable = visible.filter((r) => (r.raw_ingredients ?? "").trim());

console.log(`${visible.length} visible, ${scoreable.length} with an INCI list\n`);

const counts = new Map<string, number>();
const updates: { id: string; tags: string[] }[] = [];
for (const r of scoreable) {
  const tags = tagsFor(r.raw_ingredients);
  if (!tags.length) continue;
  for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const before = JSON.stringify((r.tags ?? []).slice().sort());
  if (before !== JSON.stringify(tags)) updates.push({ id: r.id, tags });
}

console.log("tag coverage:");
for (const [tag, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${String(Math.floor((n / scoreable.length) * 100)).padStart(3)}%  ${tag}`);
}
console.log(`\n${updates.length} products would change`);

if (WRITE && !hasTagsColumn) {
  console.log(`\nCannot write: apply the tags migration first.`);
} else if (!WRITE) {
  console.log("\nReport only. Re-run with --write to apply.");
} else {
  let ok = 0;
  for (const u of updates) {
    await rest(`products?id=eq.${encodeURIComponent(u.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ tags: u.tags }),
    });
    ok++;
  }
  console.log(`\ntagged ${ok} products`);
}
