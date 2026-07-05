// Helpers for the URL → product ingest pipeline. Server-only.

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

/** Fetch a product page and reduce it to readable text for extraction. */
export async function fetchPageText(url: string): Promise<string> {
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
 * Cheap HTML → text. Keeps JSON-LD blocks (retail pages often put the full
 * ingredient list and price there) ahead of the visible text.
 */
export function htmlToText(html: string): string {
  const jsonLd = [...html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )]
    .map((m) => m[1].trim())
    .join("\n");

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
