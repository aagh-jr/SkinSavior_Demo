import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { PasswordField } from "./PasswordField";

const meta: Meta<typeof PasswordField> = {
  title: "Account/PasswordField",
  component: PasswordField,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-[360px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PasswordField>;

/** Uncontrolled (static prototype pages). */
export const Default: Story = {};

export const CustomLabel: Story = {
  args: { label: "New password", placeholder: "At least 8 characters", autoComplete: "new-password" },
};

export const Disabled: Story = { args: { disabled: true } };

/** Controlled with real state — the Show/Hide toggle reveals the value. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState("hunter2");
    return <PasswordField {...args} value={value} onChange={setValue} />;
  },
};
