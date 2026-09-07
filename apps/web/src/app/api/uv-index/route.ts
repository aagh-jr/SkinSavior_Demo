import { NextResponse } from "next/server";
import { getUvIndex } from "@/lib/uv";

export async function GET() {
  const reading = await getUvIndex();
  if (!reading) {
    return NextResponse.json({ error: "UV data unavailable." }, { status: 502 });
  }
  return NextResponse.json(reading);
}
