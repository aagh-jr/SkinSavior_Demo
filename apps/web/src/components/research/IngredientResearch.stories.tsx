import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { http, HttpResponse, delay } from "msw";
import { IngredientResearch } from "./IngredientResearch";
import { researchOk, researchEmpty } from "@/fixtures/research.fixtures";

/**
 * Fetches an ingredient's cached PubMed papers via useIngredientResearch.
 * Each story mocks GET /api/ingredients/:id/research with MSW.
 */
const meta: Meta<typeof IngredientResearch> = {
  title: "Research/IngredientResearch",
  component: IngredientResearch,
  parameters: { layout: "padded" },
  args: { ingredientId: "ing-niacinamide" },
  decorators: [(Story) => <div className="max-w-[640px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof IngredientResearch>;

const research = (body: unknown, status = 200) =>
  http.get("*/api/ingredients/*/research", () => HttpResponse.json(body as object, { status }));

export const Success: Story = {
  parameters: { msw: { handlers: [research(researchOk)] } },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("*/api/ingredients/*/research", async () => {
          await delay("infinite");
          return HttpResponse.json(researchOk);
        }),
      ],
    },
  },
};

export const Empty: Story = {
  parameters: { msw: { handlers: [research(researchEmpty)] } },
};

export const ErrorState: Story = {
  parameters: {
    msw: { handlers: [research({ error: "Research unavailable" }, 500)] },
  },
};
