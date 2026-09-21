import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteNavView } from "@/components/SiteNavView";
import { RoutineCard, NewRoutineCard } from "@/components/routines/RoutineCards";
import { RoutineCompatibility } from "@/components/routines/RoutineCompatibility";
import { signedInSession } from "@/fixtures/user.fixtures";
import { routineSummaries, majorClashReport } from "@/fixtures/routines.fixtures";

/**
 * Routines index, assembled from visual components + fixtures: the user's
 * routines, the "new routine" affordance, and a compatibility check.
 */
const meta: Meta = {
  title: "Pages/Routines",
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj;

function RoutinesScreen({ empty = false }: { empty?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavView {...signedInSession} />
      <main className="mx-auto w-full max-w-[900px] px-6 py-10 md:px-10">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Your routines</h1>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!empty && routineSummaries.map((r) => <RoutineCard key={r.id} routine={r} />)}
          <NewRoutineCard />
        </div>

        {!empty && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl text-ink">Compatibility check</h2>
            <div className="mt-4">
              <RoutineCompatibility report={majorClashReport} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export const Default: Story = { render: () => <RoutinesScreen /> };

/** No routines yet — just the create affordance. */
export const Empty: Story = { render: () => <RoutinesScreen empty /> };

export const Mobile: Story = {
  render: () => <RoutinesScreen />,
  globals: { viewport: { value: "iphoneSE" } },
};
