import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { http, HttpResponse, delay } from "msw";
import { AiTipCard } from "./AiTipCard";

/**
 * The fetching wrapper (useAiTip -> /api/ai-tip). Each story mocks the endpoint
 * with MSW, so nothing reaches the real Gemini route.
 */
const meta: Meta<typeof AiTipCard> = {
  title: "Home/AiTipCard",
  component: AiTipCard,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-[420px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AiTipCard>;

const TIP =
  "Your morning routine looks solid — vitamin C then SPF is a great pairing. Keep it consistent for a few weeks before adding anything new.";

export const Success: Story = {
  parameters: {
    msw: {
      handlers: [http.post("*/api/ai-tip", () => HttpResponse.json({ tip: TIP }))],
    },
  },
};

export const SlowLoading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post("*/api/ai-tip", async () => {
          await delay("infinite");
          return HttpResponse.json({ tip: TIP });
        }),
      ],
    },
  },
};

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post("*/api/ai-tip", () =>
          HttpResponse.json({ error: "Please sign in for a personalized tip." }, { status: 401 }),
        ),
      ],
    },
  },
};
