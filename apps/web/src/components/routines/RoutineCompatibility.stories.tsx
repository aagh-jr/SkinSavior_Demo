import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RoutineCompatibility } from "./RoutineCompatibility";
import {
  noClashReport,
  minorClashReport,
  majorClashReport,
} from "@/fixtures/routines.fixtures";

const meta: Meta<typeof RoutineCompatibility> = {
  title: "Routines/RoutineCompatibility",
  component: RoutineCompatibility,
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="max-w-[680px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof RoutineCompatibility>;

/** No clashes — plus the niacinamide + vitamin C reassurance. */
export const NoClashes: Story = { args: { report: noClashReport } };

export const MinorClash: Story = { args: { report: minorClashReport } };

/** Retinoid + BHA on the same night. */
export const MajorClash: Story = { args: { report: majorClashReport } };

/** No report yet (e.g. still loading upstream). */
export const NoReport: Story = { args: { report: null } };

export const Mobile: Story = {
  args: { report: majorClashReport },
  globals: { viewport: { value: "iphoneSE" } },
};
