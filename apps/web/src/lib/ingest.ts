// Helpers for the URL → product ingest pipeline. Server-only.

import { Firecrawl } from "firecrawl";

const BLOCKED_HOSTS = /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/i;

const TRACKING_PARAMS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "gclid", "fbclid", "ref", "affid",
];

/** Validate and canonicalize a user-pasted URL. Throws with a user-safe message. */
export function canonicalizeUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only http(s) links are supported.");
  }
  if (BLOCKED_HOSTS.test(url.hostname) || !url.hostname.includes(".")) {
    throw new Error("That host can't be fetched.");
  }
  url.hash = "";
  for (const p of TRACKING_PARAMS) url.searchParams.delete(p);
  url.hostname = url.hostname.toLowerCase();
  return url.toString();
}

const MAX_PAGE_BYTES = 3 * 1024 * 1024;
const MAX_TEXT_CHARS = 60_000;

// Below this many characters of extracted text, treat a "successful" plain
// fetch as blocked — an anti-bot interstitial or a JS shell that rendered no
// product content (Sephora, Target, etc.). A real product page is thousands of
// characters, so this only trips on shells.
const SHELL_TEXT_THRESHOLD = 600;
const FIRECRAWL_TIMEOUT_MS = 45_000;

/**
 * Fetch a product page and reduce it to readable text for extraction.
 *
 * Tries a plain fetch first (free). When that fails, or returns a blocked /
 * empty shell, falls back to Firecrawl as a last-ditch effort — but only when
 * FIRECRAWL_API_KEY is configured. Without the key, behavior is identical to
 * the plain fetch, so this is purely additive.
 */
export async function fetchPageText(url: string): Promise<string> {
  let plain: string | null = null;
  let plainError: Error | null = null;
  try {
    plain = await fetchPageTextPlain(url);
  } catch (e) {
    plainError = e as Error;
  }

  // Plain fetch got real content → use it, no paid call.
  if (plain && plain.length >= SHELL_TEXT_THRESHOLD) return plain;

  // Plain fetch failed or looks like a blocked/empty shell → last-ditch scrape.
  const viaFirecrawl = await fetchPageTextViaFirecrawl(url);
  if (viaFirecrawl) return viaFirecrawl;

  // Firecrawl unavailable or also failed: fall back to whatever the plain
  // fetch produced, or surface the original error.
  if (plain) return plain;
  throw plainError ?? new Error("The page couldn't be fetched.");
}

/** Plain HTTP fetch + regex text reduction. Free, but blind to JS-rendered
 *  content and easily blocked by anti-bot walls. */
async function fetchPageTextPlain(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SkinSaviorBot/0.1; +https://project-ss-web.vercel.app)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`The page couldn't be fetched (HTTP ${res.status}).`);
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("html") && !contentType.includes("text")) {
    throw new Error("That link isn't an HTML page.");
  }
  const html = (await res.text()).slice(0, MAX_PAGE_BYTES);
  return htmlToText(html).slice(0, MAX_TEXT_CHARS);
}

/**
 * Last-resort scrape via Firecrawl for pages the plain fetch can't get —
 * JS-rendered storefronts and anti-bot walls (Target, Sephora). Returns null
 * when the key is absent or the call fails, so callers degrade gracefully.
 *
 * Requests `rawHtml` alongside `markdown` so we can keep the JSON-LD advantage:
 * retail pages often bury the full INCI list in ld+json, which we hoist to the
 * top exactly as the plain path does.
 */
async function fetchPageTextViaFirecrawl(url: string): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;
  try {
    const fc = new Firecrawl({ apiKey });
    const doc = await fc.scrape(url, {
      formats: ["markdown", "rawHtml"],
      onlyMainContent: false,
      timeout: FIRECRAWL_TIMEOUT_MS,
    });
    const status = doc.metadata?.statusCode;
    if (typeof status === "number" && status >= 400) return null;

    const markdown = (doc.markdown ?? "").trim();
    const jsonLd = doc.rawHtml ? extractJsonLd(doc.rawHtml) : "";
    const combined = jsonLd
      ? `STRUCTURED DATA:\n${jsonLd}\n\nPAGE TEXT:\n${markdown}`
      : markdown;
    const text = combined.trim().slice(0, MAX_TEXT_CHARS);
    return text.length ? text : null;
  } catch {
    return null;
  }
}

/** Concatenate all JSON-LD blocks from a page (retail pages often put the full
 *  ingredient list and price there). */
export function extractJsonLd(html: string): string {
  return [...html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )]
    .map((m) => m[1].trim())
    .join("\n");
}

/**
 * Cheap HTML → text. Keeps JSON-LD blocks (retail pages often put the full
 * ingredient list and price there) ahead of the visible text.
 */
export function htmlToText(html: string): string {
  const jsonLd = extractJsonLd(html);

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return jsonLd ? `STRUCTURED DATA:\n${jsonLd}\n\nPAGE TEXT:\n${text}` : text;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
