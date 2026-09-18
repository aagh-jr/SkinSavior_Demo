import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { checkAiTipRateLimit } from "@/lib/rate-limit";
import { getHomeRoutine } from "@/lib/routines-db";

// Lite tier — this is a short, cheap prompt, same model family as the
// research explainer (packages/core/src/research/explainer.ts).
const MODEL = "gemini-3.1-flash-lite";

const SYSTEM = `You are the skincare assistant inside SkinSavior, an evidence-focused skincare app. You write one short, friendly tip for the signed-in user's home screen.

Rules:
- 1-2 sentences, under 40 words, plain conversational language.
- Base the tip only on the routine listed below. If they have no routine, encourage them to build one — don't invent products they don't have.
- Never claim to treat, cure, or prevent a medical condition. Describe skin/appearance in plain terms, not disease names.
- No fearmongering: only flag a real, well-known conflict (e.g. mixing multiple strong exfoliants, layering retinoids with vitamin C acids). If nothing stands out, give a simple, encouraging routine tip instead.
- Don't invent studies, percentages, or claims not implied by the routine.`;

export async function POST() {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  // Signed-in only — this is a paid AI call.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in for a personalized tip." }, { status: 401 });
  }

  const rl = await checkAiTipRateLimit(user.id);
  if (rl.unavailable) return NextResponse.json({ error: "This feature is temporarily unavailable. Please try again later." }, { status: 503 });
  if (!rl.ok) {
    const retryAfter = rl.resetAt
      ? Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))
      : undefined;
    return NextResponse.json(
      {
        error:
          rl.scope === "day"
            ? "You've reached today's limit for AI tips. Please try again tomorrow."
            : "Too many requests. Please wait a moment and try again.",
      },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined },
    );
  }

  const homeRoutine = await getHomeRoutine();
  const routineText = homeRoutine?.steps.length
    ? homeRoutine.steps
        .map((s) => `- ${s.productBrand} ${s.productName} (${s.category}, ${s.timeOfDay})`)
        .join("\n")
    : "The user hasn't built a routine yet.";

  const ai = new GoogleGenAI({});
  let text: string;
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: `The user's current routine:\n${routineText}\n\nWrite the tip now.`,
      config: { systemInstruction: SYSTEM, temperature: 0.4 },
    });
    text = (res.text ?? "").trim();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  if (!text) {
    return NextResponse.json({ error: "No tip generated." }, { status: 502 });
  }

  return NextResponse.json({ tip: text });
}
