import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { AiTipCard } from "@/components/home/AiTipCard";
import { RoutineTimeStrip } from "@/components/home/RoutineTimeStrip";
import { getHomeRoutine } from "@/lib/routines-db";
import { createClient } from "@/lib/supabase/server";
import { getUvIndex } from "@/lib/uv";

/**
 * The signed-in user's greeting name — their profile display name, falling back
 * to the email local-part (matching handle_new_user()), then a neutral "there".
 * Read through the cookie-aware client so RLS enforces own-row access.
 */
async function getGreetingName(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "there";
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const name = (data as { display_name: string | null } | null)?.display_name;
  return name?.trim() || user.email?.split("@")[0] || "there";
}

export const metadata: Metadata = {
  title: "Your home",
  description:
    "Your personalized skinsavior home — your routine, today's AI tip, UV index, and your sunscreen streak.",
};

// Routine, UV index (Open-Meteo, San Jose — no location service yet) and the
// AI tip (Gemini, grounded in the routine) are all live. The sunscreen
// tracker below is still a static reproduction of the redesign — there is no
// application-logging backend yet, so it carries the design's demo values.
export const dynamic = "force-dynamic";

// Static reproduction of the redesign's sunscreen tracker. August 2026 starts
// on a Saturday, so a Mon-first grid opens with 5 blank cells. Values are the
// design's demo data; 0–3 map to the four-step legend.
const SPF_COUNTS = [
  3, 2, 1, 3, 3, 2, 0, 3, 3, 3, 1, 2, 3, 3, 0, 2, 3, 3, 3, 1, 0, 2, 3, 3, 2, 3,
  1, 0, 3, 3, 2,
];
const SPF_BG = ["#F5F7FA", "#CFEEE0", "#6FC7A4", "#159A6B"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function HomePage() {
  const [homeRoutine, firstName, uv] = await Promise.all([
    getHomeRoutine(),
    getGreetingName(),
    getUvIndex(),
  ]);

  const steps = homeRoutine?.steps ?? [];
  const amSteps = steps.filter((s) => s.timeOfDay === "am" || s.timeOfDay === "both");
  const pmSteps = steps.filter((s) => s.timeOfDay === "pm" || s.timeOfDay === "both");

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <main className="mx-auto max-w-[1180px] px-6 py-10 md:px-14">
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* LEFT COLUMN — welcome + routine */}
          <div className="flex min-w-0 flex-col gap-6">
            <div>
              <h1 className="font-serif text-4xl leading-[1.06] tracking-tight text-ink md:text-[44px]">
                Welcome back {firstName},
              </h1>
              <p className="mt-2.5 text-sm text-muted-foreground">
                {homeRoutine
                  ? `${homeRoutine.name} · ${steps.length} ${steps.length === 1 ? "product" : "products"}`
                  : "You haven't built a routine yet"}
              </p>
            </div>

            <div className="min-w-0 overflow-hidden rounded-xl border border-soft-tan bg-warm-white">
              <div className="flex items-center justify-between px-5 pb-3.5 pt-[18px]">
                <div>
                  <h2 className="m-0 font-serif text-xl text-ink">Your routine</h2>
                  <div className="mt-0.5 text-[13px] text-faint">
                    {homeRoutine
                      ? `${homeRoutine.name} · ${steps.length} ${steps.length === 1 ? "product" : "products"}`
                      : "Nothing here yet"}
                  </div>
                </div>
                {homeRoutine ? (
                  <Link
                    href={`/routines/${homeRoutine.id}`}
                    aria-label="Manage your routine"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ink text-warm-white transition-opacity hover:opacity-85"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M3.33 8h9.33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.33 4.67L12.67 8l-3.34 3.33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ) : (
                  <Link
                    href="/routines"
                    className="text-[12px] font-semibold text-link hover:underline"
                  >
                    Build one →
                  </Link>
                )}
              </div>

              {homeRoutine ? (
                <RoutineTimeStrip
                  amSteps={amSteps}
                  pmSteps={pmSteps}
                  routineId={homeRoutine.id}
                />
              ) : (
                <Link
                  href="/routines"
                  className="flex items-center justify-center border-t border-soft-tan px-5 py-10 text-sm font-semibold text-link transition-colors hover:bg-secondary"
                >
                  + Build your first routine
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — AI tip + UV index */}
          <div className="flex flex-col gap-4">
            <AiTipCard />

            <div
              className="rounded-xl border border-soft-tan p-5 text-white"
              style={{
                background: "linear-gradient(150deg, #FFC876, #D97706)",
              }}
            >
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">
                    UV index · {uv?.location ?? "San Jose, CA"}
                  </div>
                  <div className="mt-1.5 font-serif text-[44px] font-semibold leading-none">
                    {uv?.uv ?? "–"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-bold">{uv?.label ?? "Unavailable"}</div>
                  <div className="text-[12px] text-white/75">
                    {uv?.reapply ?? "Check back later"}
                  </div>
                </div>
              </div>
              <div className="mt-3.5 flex gap-1">
                {Array.from({ length: 4 }).map((_, i) => {
                  const frac = uv ? Math.min(1, Math.max(0, uv.uv / 11 - i * 0.25) * 4) : 0;
                  return (
                    <div
                      key={i}
                      className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20"
                    >
                      <div
                        className="h-full rounded-full bg-white/90"
                        style={{ width: `${frac * 100}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FULL-WIDTH — sunscreen tracker (static) */}
          <div className="min-w-0 rounded-xl border border-soft-tan bg-warm-white px-6 py-5 lg:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="m-0 font-serif text-[22px] text-ink">SPF application</h2>
                <div className="mt-0.5 text-[13px] text-faint">
                  August · self-reported, 24 of 31 days logged
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-faint">0</span>
                <div className="flex gap-[3px]">
                  {SPF_BG.map((bg, i) => (
                    <div
                      key={i}
                      className="h-4 w-4 rounded"
                      style={{
                        background: bg,
                        border: i === 0 ? "1px solid #DEE3E9" : undefined,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-faint">3+ applications</span>
              </div>
            </div>
            <div className="mt-3.5 grid max-w-[520px] grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center font-mono text-[10px] uppercase tracking-[0.1em] text-faint"
                >
                  {d}
                </div>
              ))}
              {/* 5 leading blanks — August 2026 begins on a Saturday. */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`blank-${i}`} className="h-8" />
              ))}
              {SPF_COUNTS.map((c, i) => (
                <div
                  key={i}
                  className="h-8 rounded-md border border-soft-tan px-1 py-[3px]"
                  style={{ background: SPF_BG[c] }}
                >
                  <span
                    className="font-mono text-[9px]"
                    style={{ color: c >= 2 ? "rgba(255,255,255,.85)" : "#5B6472" }}
                  >
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
