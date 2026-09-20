/** Client-safe tidy of a raw category value for a product card subtitle. */
export function prettyCategory(c: string | null): string {
  if (!c) return "";
  return c
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}
