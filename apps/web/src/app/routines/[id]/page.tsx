import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { RoutineBuilder } from "@/components/routines/RoutineBuilder";
import { RoutineCompatibility } from "@/components/routines/RoutineCompatibility";
import { createClient } from "@/lib/supabase/server";
import { getRoutine, getRoutineSteps } from "@/lib/routines-db";
import { analyzeMyRoutine } from "@/lib/compatibility-db";

export const metadata: Metadata = {
  title: "Routine",
  description: "Build a skincare routine that fits your skin and your goals.",
};

export default async function RoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Same convention as /user: signed-out visitors go to the quiz funnel.
  if (!user) redirect("/quiz");

  const routine = await getRoutine(id);
  if (!routine) notFound();

  const steps = await getRoutineSteps(id);
  // Null until at least one real product is attached — an "all clear" on a
  // routine of empty placeholder slots would be a false reassurance.
  const compatibility = await analyzeMyRoutine(id);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto w-full max-w-[860px] px-6 py-12 md:px-12 md:py-16">
        <Link
          href="/routines"
          className="text-[13px] text-muted-foreground transition-colors hover:text-ink"
        >
          ← All routines
        </Link>

        <RoutineBuilder
          routineId={routine.id}
          initialName={routine.name}
          initialDescription={routine.description}
          initialSteps={steps}
        />

        <RoutineCompatibility report={compatibility} />
      </main>
    </div>
  );
}
