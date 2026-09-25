import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RoutineBuilder } from "./RoutineBuilder";
import { pmRoutineSteps, emptyRoutineSteps } from "@/fixtures/routines.fixtures";

/**
 * Drag-and-drop routine editor. Mutations call server actions Storybook can't
 * run (stubbed); these cover the render + drag layout.
 */
const meta: Meta<typeof RoutineBuilder> = {
  title: "Routines/RoutineBuilder",
  component: RoutineBuilder,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof RoutineBuilder>;

export const Default: Story = {
  args: {
    routineId: "routine-pm",
    initialName: "Evening routine",
    initialDescription: "Retinoid night, kept simple.",
    initialSteps: pmRoutineSteps,
  },
};

export const EmptyRoutine: Story = {
  args: {
    routineId: "routine-empty",
    initialName: "New routine",
    initialDescription: null,
    initialSteps: emptyRoutineSteps,
  },
};

export const Mobile: Story = {
  args: {
    routineId: "routine-pm",
    initialName: "Evening routine",
    initialDescription: "Retinoid night, kept simple.",
    initialSteps: pmRoutineSteps,
  },
  globals: { viewport: { value: "iphoneSE" } },
};
