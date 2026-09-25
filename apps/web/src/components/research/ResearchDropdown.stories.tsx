import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { http, HttpResponse } from "msw";
import { ResearchDropdown } from "./ResearchDropdown";
import { researchOk } from "@/fixtures/research.fixtures";

const okHandler = http.get("*/api/ingredients/*/research", () => HttpResponse.json(researchOk));

const meta: Meta<typeof ResearchDropdown> = {
  title: "Research/ResearchDropdown",
  component: ResearchDropdown,
  parameters: { layout: "padded", msw: { handlers: [okHandler] } },
  decorators: [
    (Story) => (
      <div className="max-w-[680px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ResearchDropdown>;

/** Papers load for the active ingredient; each result expands independently. */
export const Default: Story = {
  args: {
    ingredients: [
      { ingredientId: "ing-niacinamide", label: "Niacinamide" },
      { ingredientId: "ing-ascorbic-acid", label: "Vitamin C" },
    ],
  },
};

/** No researched ingredients → renders nothing. */
export const None: Story = { args: { ingredients: [] } };
