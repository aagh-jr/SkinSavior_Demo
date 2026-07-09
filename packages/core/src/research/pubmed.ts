import { XMLParser } from "fast-xml-parser";
import type { Paper } from "./schema";

// PubMed E-utilities. Two calls: esearch (JSON, PMIDs) then efetch (XML, full
// records). See files/ingredient-research-spec.md section 2.
const ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

/** NCBI etiquette: identify the app on every request. */
const TOOL = "skinsavior";
const EMAIL = "gonzalez.abel2003@gmail.com";

/** How many papers to surface per ingredient. */
export const TOP_N = 5;

/**
 * Domain scope appended to the ingredient name. Many actives (niacinamide,
 * caffeine, urea) have large non-dermatology literatures, so we keep
 * ingredient-level breadth but pin the query to skin context. Tunable without
 * touching the query-building logic.
 */
export const DOMAIN_SCOPE = "(skin OR dermatology OR topical OR cutaneous)";

/** Build the PubMed query term for an ingredient. */
export function buildQuery(ingredientName: string): string {
  return `"${ingredientName.trim()}" AND ${DOMAIN_SCOPE}`;
}

function commonParams(): Record<string, string> {
  const params: Record<string, string> = { tool: TOOL, email: EMAIL };
  const key = process.env.NCBI_API_KEY;
  if (key) params.api_key = key;
  return params;
}

// fast-xml-parser: keep attributes (we need ArticleId@IdType and the #text of
// tagged nodes like PublicationType), and stop it from stripping leading zeros
// off PMIDs by treating tag values as strings where it matters.
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  // Abstracts/titles carry numeric + named HTML entities (e.g. NF&#x3ba;B,
  // 5&#181;g); decode them so the UI shows κ/µ rather than the raw codes.
  processEntities: true,
  htmlEntities: true,
});

/** Coerce a fast-xml-parser node (string | number | { "#text" } | array) to text. */
function nodeText(node: unknown): string | null {
  if (node == null) return null;
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    const parts = node.map(nodeText).filter((s): s is string => !!s);
    return parts.length ? parts.join(" ") : null;
  }
  if (typeof node === "object") {
    const t = (node as Record<string, unknown>)["#text"];
    return t == null ? null : nodeText(t);
  }
  return null;
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/** Parse a single <PubmedArticle> object into a Paper (rank filled by caller). */
function parseArticle(article: Record<string, any>): Omit<Paper, "rank"> | null {
  const citation = article?.MedlineCitation;
  const art = citation?.Article;
  if (!citation || !art) return null;

  const pmid = nodeText(citation.PMID);
  if (!pmid) return null;

  const title = nodeText(art.ArticleTitle) ?? "(untitled)";
  const journal = nodeText(art.Journal?.Title);

  // Year: prefer a clean <Year>, else pull the first 4-digit run out of a
  // <MedlineDate> like "2019 Jan-Feb".
  const pubDate = art.Journal?.JournalIssue?.PubDate;
  let year: number | null = null;
  const yearText = nodeText(pubDate?.Year) ?? nodeText(pubDate?.MedlineDate);
  const yearMatch = yearText?.match(/\d{4}/);
  if (yearMatch) year = Number(yearMatch[0]);

  // Abstract: may be a single string or structured sections (Background,
  // Methods, ...). Join them into the first ~2 sentences' worth of text.
  const abstractSections = asArray(art.Abstract?.AbstractText).map(nodeText).filter(Boolean);
  const abstract = abstractSections.length ? abstractSections.join(" ") : null;

  const publication_types = asArray(art.PublicationTypeList?.PublicationType)
    .map(nodeText)
    .filter((s): s is string => !!s);

  // DOI lives in PubmedData > ArticleIdList (also sometimes in ELocationID).
  const articleIds = asArray(article.PubmedData?.ArticleIdList?.ArticleId);
  let doi: string | null = null;
  for (const id of articleIds) {
    if (id?.["@_IdType"] === "doi") {
      doi = nodeText(id);
      break;
    }
  }
  if (!doi) {
    for (const el of asArray(art.ELocationID)) {
      if (el?.["@_EIdType"] === "doi") {
        doi = nodeText(el);
        break;
      }
    }
  }

  return {
    pmid,
    title,
    abstract,
    journal,
    year,
    publication_types,
    doi,
    pubmed_url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
  };
}

/** Parse a raw efetch XML string into ordered papers (no rank yet). */
export function parseEfetchXml(xml: string): Omit<Paper, "rank">[] {
  const doc = parser.parse(xml);
  const articles = asArray(doc?.PubmedArticleSet?.PubmedArticle);
  return articles
    .map((a: Record<string, any>) => parseArticle(a))
    .filter((p): p is Omit<Paper, "rank"> => p !== null);
}

/**
 * Fetch the top-5 most relevant PubMed papers for an ingredient. Never throws:
 * on no results returns [], on any API/parse error also returns [] (the cache
 * layer distinguishes empty vs error by catching separately — see below).
 */
export async function fetchPubMedPapers(ingredientName: string): Promise<Paper[]> {
  const base = commonParams();

  // 1. esearch -> PMIDs, sorted by relevance.
  const searchParams = new URLSearchParams({
    ...base,
    db: "pubmed",
    retmode: "json",
    retmax: String(TOP_N),
    sort: "relevance",
    term: buildQuery(ingredientName),
  });
  const searchRes = await fetch(`${ESEARCH_URL}?${searchParams}`);
  if (!searchRes.ok) throw new Error(`esearch failed: HTTP ${searchRes.status}`);
  const searchJson = (await searchRes.json()) as {
    esearchresult?: { idlist?: string[] };
  };
  const pmids = searchJson.esearchresult?.idlist ?? [];
  if (!pmids.length) return [];

  // 2. efetch -> full records (XML). Preserve the esearch relevance order.
  const fetchParams = new URLSearchParams({
    ...base,
    db: "pubmed",
    retmode: "xml",
    id: pmids.join(","),
  });
  const fetchRes = await fetch(`${EFETCH_URL}?${fetchParams}`);
  if (!fetchRes.ok) throw new Error(`efetch failed: HTTP ${fetchRes.status}`);
  const xml = await fetchRes.text();

  const parsed = parseEfetchXml(xml);
  const byPmid = new Map(parsed.map((p) => [p.pmid, p]));

  // Re-order to esearch's relevance ranking and stamp rank 1..5.
  const papers: Paper[] = [];
  for (const pmid of pmids) {
    const p = byPmid.get(pmid);
    if (p) papers.push({ ...p, rank: papers.length + 1 });
    if (papers.length >= TOP_N) break;
  }
  return papers;
}
