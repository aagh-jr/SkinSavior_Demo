import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProductThumb } from "./ProductThumb";
import { PLACEHOLDER_IMAGE } from "@/fixtures/products.fixtures";

const meta: Meta<typeof ProductThumb> = {
  title: "Products/ProductThumb",
  component: ProductThumb,
  parameters: { layout: "centered" },
  args: {
    className: "h-[220px] w-[180px] rounded-[14px] border border-border",
    name: "Niacinamide 10% + Zinc 1%",
    category: "Serum",
  },
};
export default meta;

type Story = StoryObj<typeof ProductThumb>;

export const Default: Story = {
  args: { imageUrl: PLACEHOLDER_IMAGE },
};

/** No photo → the category line icon fallback. */
export const NoPhotoFallback: Story = {
  args: { imageUrl: null, category: "Sunscreen" },
};

export const Cleanser: Story = {
  args: { imageUrl: null, category: "Cleanser" },
};

export const Mobile: Story = {
  args: { imageUrl: PLACEHOLDER_IMAGE },
  globals: { viewport: { value: "iphoneSE" } },
};
