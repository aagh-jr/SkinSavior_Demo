import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { http, HttpResponse } from "msw";
import { SearchBar } from "./SearchBar";

/**
 * Global search. Closed until focused; typing calls /api/{mode}/search, mocked
 * here with MSW so nothing reaches the backend.
 */
const searchHandlers = [
  http.get("*/api/products/search", () => HttpResponse.json({ results: [] })),
  http.get("*/api/ingredients/search", () => HttpResponse.json({ results: [] })),
];

const meta: Meta<typeof SearchBar> = {
  title: "Nav/SearchBar",
  component: SearchBar,
  parameters: { layout: "padded", msw: { handlers: searchHandlers } },
  decorators: [(Story) => <div className="max-w-[420px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof SearchBar>;

export const Products: Story = { args: { initialMode: "products" } };

export const Ingredients: Story = { args: { initialMode: "ingredients" } };

export const WithInitialQuery: Story = {
  args: { initialMode: "products", initialQuery: "niacinamide" },
};

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
