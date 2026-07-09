import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { parseEfetchXml, buildQuery, DOMAIN_SCOPE } from "./pubmed";

// Saved efetch response (3 real PubMed records for niacinamide) so the parser
// is tested without hitting the live API.
const sampleXml = readFileSync(
  fileURLToPath(new URL("./__fixtures__/efetch-sample.xml", import.meta.url)),
  "utf8",
);

describe("buildQuery", () => {
  it("wraps the ingredient and appends the domain scope", () => {
    expect(buildQuery("niacinamide")).toBe(`"niacinamide" AND ${DOMAIN_SCOPE}`);
  });
  it("trims the ingredient name", () => {
    expect(buildQuery("  retinol ")).toBe(`"retinol" AND ${DOMAIN_SCOPE}`);
  });
});

describe("parseEfetchXml", () => {
  const papers = parseEfetchXml(sampleXml);

  it("parses every article in the set", () => {
    expect(papers).toHaveLength(3);
  });

  it("extracts pmid, title, journal and year", () => {
    const p = papers[0];
    expect(p.pmid).toBe("24993939");
    expect(p.title).toMatch(/^Niacinamide/);
    expect(p.journal).toBe("Skin pharmacology and physiology");
    expect(p.year).toBe(2014);
  });

  it("extracts DOI when present and builds the pubmed url", () => {
    const p = papers[0];
    expect(p.doi).toBe("10.1159/000359974");
    expect(p.pubmed_url).toBe("https://pubmed.ncbi.nlm.nih.gov/24993939/");
  });

  it("extracts publication types for the study-type badge", () => {
    expect(papers[0].publication_types).toContain("Review");
    // The pigmentation study is a clinical/RCT record.
    const rct = papers.find((p) => p.pmid === "12100180");
    expect(rct?.publication_types.length).toBeGreaterThan(0);
  });

  it("captures a non-empty abstract", () => {
    expect(papers[0].abstract).toBeTruthy();
    expect(papers[0].abstract!.length).toBeGreaterThan(50);
  });

  it("decodes HTML entities in text (no raw &#x..; codes)", () => {
    const all = papers.map((p) => `${p.title} ${p.abstract ?? ""}`).join(" ");
    expect(all).not.toMatch(/&#x?[0-9a-f]+;/i);
    // The niacinamide mechanisms abstract references NF-κB.
    expect(papers[0].abstract).toContain("NFκB");
  });

  it("returns pmid as a string (no numeric coercion / zero stripping)", () => {
    for (const p of papers) expect(typeof p.pmid).toBe("string");
  });
});
