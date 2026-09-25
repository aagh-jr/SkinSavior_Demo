import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { http, HttpResponse } from "msw";
import { ProductResearch } from "./ProductResearch";
import { researchOk } from "@/fixtures/research.fixtures";

const okHandler = http.get("*/api/ingredients/*/research", () =>
  HttpResponse.json(researchOk),
);

const meta: Meta<typeof ProductResearch> = {
  title: "Research/ProductResearch",
  component: ProductResearch,
  parameters: { layout: "padded", msw: { handlers: [okHandler] } },
  decorators: [(Story) => <div className="max-w-[640px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof ProductResearch>;

/** Multiple researched ingredients — pill toggle across them. */
export const MultipleIngredients: Story = {
  args: {
    ingredients: [
      { ingredientId: "ing-niacinamide", label: "Niacinamide" },
      { ingredientId: "ing-ascorbic-acid", label: "Vitamin C" },
      { ingredientId: "ing-retinol", label: "Retinol" },
    ],
  },
};

/** A single researched ingredient — no toggle row. */
export const SingleIngredient: Story = {
  args: { ingredients: [{ ingredientId: "ing-niacinamide", label: "Niacinamide" }] },
};

/** No researched ingredients → renders nothing. */
export const None: Story = { args: { ingredients: [] } };
