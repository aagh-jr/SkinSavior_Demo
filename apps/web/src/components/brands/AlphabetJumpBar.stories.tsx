import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AlphabetJumpBar } from "./AlphabetJumpBar";
import { ALPHABET, activeLetters } from "@/fixtures/brands.fixtures";

const meta: Meta<typeof AlphabetJumpBar> = {
  title: "Brands/AlphabetJumpBar",
  component: AlphabetJumpBar,
  parameters: { layout: "padded" },
  args: { letters: ALPHABET, activeLetters },
};
export default meta;

type Story = StoryObj<typeof AlphabetJumpBar>;

export const Default: Story = {};

/** No brands anywhere — every letter is inert. */
export const NoneActive: Story = { args: { activeLetters: new Set<string>() } };

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
