import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyNote } from "./EmptyNote";

const meta: Meta<typeof EmptyNote> = {
  title: "Shelf/EmptyNote",
  component: EmptyNote,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof EmptyNote>;

export const Default: Story = {
  args: { children: "No products in use yet. Add one from any product page." },
};

export const LongText: Story = {
  args: {
    children:
      "You haven't saved anything yet. Browse the catalogue and tap the bookmark on any product to keep it here — saved items stay on your shelf even when they aren't part of a routine, so this is a good place to park things you're still deciding on.",
  },
};
