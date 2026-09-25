import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BrandLetterSection } from "./BrandLetterSection";
import { brands, brandsByLetter } from "@/fixtures/brands.fixtures";

const meta: Meta<typeof BrandLetterSection> = {
  title: "Brands/BrandLetterSection",
  component: BrandLetterSection,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof BrandLetterSection>;

export const Default: Story = {
  args: { letter: "C", brands: brandsByLetter["C"] ?? [] },
};

/** A dense letter with many brands. */
export const Many: Story = {
  args: { letter: "A", brands: [...brands, ...brands, ...brands] },
};

export const SingleBrand: Story = {
  args: { letter: "E", brands: brandsByLetter["E"] ?? [] },
};
