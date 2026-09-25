import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { UsernameField } from "./UsernameField";

const meta: Meta<typeof UsernameField> = {
  title: "Account/UsernameField",
  component: UsernameField,
  parameters: { layout: "padded" },
  args: { value: "", onChange: () => {} },
  decorators: [
    (Story) => (
      <div className="max-w-[360px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof UsernameField>;

export const Empty: Story = {};

export const Filled: Story = { args: { value: "skin_fan99" } };

export const Taken: Story = {
  args: { value: "abel", error: "That username is taken." },
};

export const Disabled: Story = { args: { value: "skin_fan99", disabled: true } };

/** Controlled with real state — typing is lowercased as you go. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState("");
    return <UsernameField {...args} value={value} onChange={setValue} />;
  },
};

export const Mobile: Story = {
  args: { value: "skin_fan99" },
  globals: { viewport: { value: "iphoneSE" } },
};
