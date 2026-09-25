import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SaveButton } from "./SaveButton";

/**
 * Save-to-shelf button. The click calls a server action, which Storybook does
 * not run — these stories cover the render states (signed out renders nothing).
 */
const meta: Meta<typeof SaveButton> = {
  title: "Products/SaveButton",
  component: SaveButton,
  parameters: { layout: "centered" },
  args: { productId: "prod-niacinamide", initialSaved: false, signedIn: true },
};
export default meta;

type Story = StoryObj<typeof SaveButton>;

export const NotSaved: Story = {};

export const Saved: Story = { args: { initialSaved: true } };

/** Signed out → renders nothing. */
export const SignedOut: Story = { args: { signedIn: false } };

/** Saving temporarily unavailable → a status message. */
export const Unavailable: Story = { args: { unavailable: true } };
