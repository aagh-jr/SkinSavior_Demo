import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { AiTipCard } from "@/components/home/AiTipCard";
import { RoutineTimeStrip } from "@/components/home/RoutineTimeStrip";
import { getHomeRoutine } from "@/lib/routines-db";
import { createClient } from "@/lib/supabase/server";

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
  if (!user) redirect("/landing");
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
  description: "Your personalized skinsavior home — your routine and today's tip.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [homeRoutine, firstName] = await Promise.all([
    getHomeRoutine(),
    getGreetingName(),
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

          {/* RIGHT COLUMN — routine-grounded tip */}
          <div className="flex flex-col gap-4">
            <AiTipCard />
          </div>


        </div>
      </main>
    </div>
  );
}
