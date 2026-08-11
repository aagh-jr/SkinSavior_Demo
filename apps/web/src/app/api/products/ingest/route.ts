import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { productExtractionSchema } from "@skinsavior/core/schemas";
import { canonicalizeUrl, fetchPageText } from "@/lib/ingest";
import { createClient } from "@/lib/supabase/server";
import { checkIngestRateLimit } from "@/lib/rate-limit";
import {
  addProductSource,
  findProductByIngredientFingerprint,
  findProductByUrl,
  findSimilarProduct,
  insertExtractedProduct,
} from "@/lib/products-db";

export const maxDuration = 120;

const MODEL = "claude-opus-4-8";

// Above this trigram similarity, treat the extraction as a duplicate of an
// existing product rather than creating a new page.
const DUPLICATE_SIMILARITY = 0.65;

const requestSchema = z.object({ url: z.string().min(1) });

const EXTRACTION_SYSTEM = `You extract structured skincare product data from web pages for SkinSavior, an evidence-focused skincare app.

Rules:
- Only extract what the page actually says. Never invent ingredients, prices, or percentages.
- "origin" is the one exception: fill it with the brand's country of origin from your own knowledge of the brand, even when the page doesn't state it. Use a canonical English country name (e.g. "South Korea", "United States", "France"). Use null only if you don't recognize the brand well enough to be confident. Every other field must come strictly from the page.
- The ingredient list must be the full INCI list in printed order. If the page shows only "key ingredients", extract those and set confidence to "low".
- "claims" are the brand's marketing statements, verbatim. Do not evaluate or soften them — they are stored as unevaluated claims.
- The description must be neutral and factual: what the product is and what its formulation centers on. No superlatives.
- If the page is a category listing, article, or anything other than a single product page, set is_product_page to false and leave other fields minimal.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  // Ingest is a paid AI call, so it's gated to signed-in users — anonymous
  // visitors can browse the encyclopedia but can't spend the Anthropic budget.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to add a product." },
      { status: 401 },
    );
  }

  // Per-user throttle (3/min, 40/day) so no single account can drain the bill.
  const rl = await checkIngestRateLimit(user.id);
  if (!rl.ok) {
    const retryAfter = rl.resetAt
      ? Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))
      : undefined;
    return NextResponse.json(
      {
        error:
          rl.scope === "day"
            ? "You've reached today's limit for adding products. Please try again tomorrow."
            : "You're adding products too quickly. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined,
      },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Expected a JSON body with a 'url' string." }, { status: 400 });
  }

  let url: string;
  try {
    url = canonicalizeUrl(parsed.data.url);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // 1. Exact URL already known → route the user to the existing page.
  const known = await findProductByUrl(url);
  if (known) {
    return NextResponse.json({ status: "existing", slug: known.slug });
  }

  // 2. Fetch and flatten the page.
  let pageText: string;
  try {
    pageText = await fetchPageText(url);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }

  // 3. Extract with Claude, constrained to the shared schema.
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: EXTRACTION_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Source URL: ${url}\n\nPage content:\n${pageText}`,
      },
    ],
    output_config: { format: zodOutputFormat(productExtractionSchema) },
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return NextResponse.json(
      { error: "The page couldn't be analyzed. Try a different link." },
      { status: 422 },
    );
  }
  const extraction = response.parsed_output;

  if (!extraction.is_product_page || !extraction.name || !extraction.brand) {
    return NextResponse.json(
      { error: "That link doesn't look like a single product's page." },
      { status: 422 },
    );
  }

  // 4a. Formula-dedupe (strongest): same brand + matching INCI list. Retailer
  //     titles vary wildly for the same product, but the ingredient list does
  //     not — so this catches duplicates that name matching misses. Skipped
  //     automatically when the page had too few ingredients to fingerprint.
  const byFormula = await findProductByIngredientFingerprint(
    extraction.brand,
    extraction.ingredients.map((i) => i.inci_name),
  );
  if (byFormula) {
    await addProductSource(byFormula.id, url);
    return NextResponse.json({ status: "existing", slug: byFormula.slug });
  }

  // 4b. Fallback name-fuzzy dedupe for pages with no/short ingredient lists,
  //     where the formula fingerprint isn't available.
  const similar = await findSimilarProduct(extraction.brand, extraction.name);
  if (similar && similar.sim >= DUPLICATE_SIMILARITY) {
    await addProductSource(similar.id, url);
    return NextResponse.json({ status: "existing", slug: similar.slug });
  }

  // 5. New product → persist and return its page.
  try {
    const slug = await insertExtractedProduct(extraction, url, MODEL);
    return NextResponse.json({ status: "created", slug, confidence: extraction.confidence });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
