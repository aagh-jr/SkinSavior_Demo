import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteNavView } from "@/components/SiteNavView";
import { AiTipCardView } from "@/components/home/AiTipCardView";
import { RoutineTimeStrip } from "@/components/home/RoutineTimeStrip";
import { signedInSession } from "@/fixtures/user.fixtures";
import { amRoutineSteps, pmRoutineSteps } from "@/fixtures/routines.fixtures";

/**
 * Home screen, assembled from visual components + fixtures (not the real
 * page.tsx, which loads live data). Signed-in nav, an AI tip, and the AM/PM
 * routine strip.
 */
const meta: Meta = {
  title: "Pages/Home",
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj;

function HomeScreen({ tipStatus = "ok" as const }: { tipStatus?: "ok" | "loading" }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavView {...signedInSession} />
      <main className="mx-auto w-full max-w-[1000px] px-6 py-10 md:px-10">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">
          Good morning, Maya.
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Here&apos;s your routine and today&apos;s tip.
        </p>

        <div className="mt-8 max-w-[440px]">
          <AiTipCardView
            status={tipStatus}
            tip="Your morning routine looks solid — vitamin C then SPF is a great pairing. Keep it consistent before adding anything new."
            error=""
            onRefresh={() => {}}
          />
        </div>

        <section className="mt-10 overflow-hidden rounded-[24px] border border-soft-tan bg-warm-white">
          <div className="px-5 pt-5">
            <h2 className="font-serif text-2xl text-ink">Today&apos;s routine</h2>
          </div>
          <RoutineTimeStrip
            amSteps={amRoutineSteps}
            pmSteps={pmRoutineSteps}
            routineId="routine-am"
          />
        </section>
      </main>
    </div>
  );
}

export const Default: Story = { render: () => <HomeScreen /> };

export const TipLoading: Story = { render: () => <HomeScreen tipStatus="loading" /> };

export const Mobile: Story = {
  render: () => <HomeScreen />,
  globals: { viewport: { value: "iphoneSE" } },
};
