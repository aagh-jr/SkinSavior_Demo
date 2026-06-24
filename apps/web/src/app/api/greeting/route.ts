import { NextResponse } from "next/server";
import { z } from "zod";

// Ported from the former TanStack `createServerFn` example
// (src/lib/api/example.functions.ts). In Next.js, server logic lives in Route
// Handlers (or Server Actions) instead of serverFns. Call from the client:
//   const res = await fetch("/api/greeting", {
//     method: "POST",
//     body: JSON.stringify({ name: "Ada" }),
//   });
const bodySchema = z.object({ name: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  return NextResponse.json({
    greeting: `Hello, ${parsed.data.name}!`,
    mode: process.env.NODE_ENV ?? "unknown",
  });
}
