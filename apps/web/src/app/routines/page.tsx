import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { NewRoutineCard, RoutineCard } from "@/components/routines/RoutineCards";
import { createClient } from "@/lib/supabase/server";
import { listMyRoutines } from "@/lib/routines-db";

export const metadata: Metadata = {
  title: "My routines",
  description:
    "All your skincare routines in one place — build as many as you need for your skin, your goals, and the time you actually have.",
};

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Same convention as /user: signed-out visitors go to the quiz funnel.
  if (!user) redirect("/quiz");

  const routines = await listMyRoutines();

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto w-full max-w-[860px] px-6 py-12 md:px-12 md:py-16">
        <div className="mb-2 text-[13px] text-muted-foreground">Plans / My routines</div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
          My routines
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Build as many routines as you need — one for mornings, one for travel, one for
          your barrier-repair phase. Open any card to add products and set the schedule.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {routines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} />
          ))}
          <NewRoutineCard />
        </div>
      </main>
    </div>
  );
}
