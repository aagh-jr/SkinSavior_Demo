import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PendingAnswersFlush } from "./PendingAnswersFlush";

/**
 * Behaviour-only component: on sign-in it flushes stashed quiz answers and
 * shows a toast, then renders nothing. There's no visual surface — this story
 * exists to prove it mounts cleanly under the mocked session (no error).
 */
const meta: Meta<typeof PendingAnswersFlush> = {
  title: "System/PendingAnswersFlush",
  component: PendingAnswersFlush,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof PendingAnswersFlush>;

export const MountsCleanly: Story = {
  render: () => (
    <div className="text-sm text-muted-foreground">
      <PendingAnswersFlush />
      (renders nothing — flushes pending quiz answers on sign-in)
    </div>
  ),
};
