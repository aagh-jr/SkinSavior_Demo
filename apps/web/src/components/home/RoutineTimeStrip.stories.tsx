import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RoutineTimeStrip } from "./RoutineTimeStrip";
import { amRoutineSteps, pmRoutineSteps } from "@/fixtures/routines.fixtures";

const meta: Meta<typeof RoutineTimeStrip> = {
  title: "Home/RoutineTimeStrip",
  component: RoutineTimeStrip,
  parameters: { layout: "padded" },
  args: { amSteps: amRoutineSteps, pmSteps: pmRoutineSteps, routineId: "routine-am" },
};
export default meta;

type Story = StoryObj<typeof RoutineTimeStrip>;

/** Defaults to the PM view; toggle AM/PM in the canvas. */
export const Default: Story = {};

/** No PM steps — the strip is empty when PM is selected. */
export const EmptyPm: Story = { args: { pmSteps: [] } };

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
