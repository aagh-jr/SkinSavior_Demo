import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RoutineCard, NewRoutineCard } from "./RoutineCards";
import { routineSummaries } from "@/fixtures/routines.fixtures";

const meta: Meta<typeof RoutineCard> = {
  title: "Routines/RoutineCards",
  component: RoutineCard,
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="max-w-[360px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof RoutineCard>;

/** The primary routine (shows the primary marker). */
export const Primary: Story = { args: { routine: routineSummaries[0] } };

/** A secondary routine. */
export const Secondary: Story = { args: { routine: routineSummaries[1] } };

/** An empty routine (0 steps, no description). */
export const EmptyRoutine: Story = { args: { routine: routineSummaries[2] } };

/** The "create a new routine" affordance. */
export const NewRoutine: StoryObj<typeof NewRoutineCard> = {
  render: () => <NewRoutineCard />,
};
