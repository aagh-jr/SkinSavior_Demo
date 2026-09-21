import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuthShell, authClass } from "./AuthShell";
import { PasswordField } from "./PasswordField";

const meta: Meta<typeof AuthShell> = {
  title: "Account/AuthShell",
  component: AuthShell,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof AuthShell>;

function LoginCard() {
  return (
    <div className={authClass.card}>
      <h1 className="mb-1 font-serif text-[24px] font-semibold text-ink">Welcome back</h1>
      <p className="mb-5 text-[14px] text-muted-foreground">Sign in to your shelf.</p>
      <label className={authClass.label}>Email</label>
      <input className={authClass.input} placeholder="you@example.com" />
      <div className="h-3.5" />
      <PasswordField />
      <button className={authClass.primaryBtn}>Sign in</button>
    </div>
  );
}

export const Login: Story = {
  args: { children: <LoginCard /> },
};

/** With the optional back link in the header. */
export const WithBackLink: Story = {
  args: {
    back: { href: "/login", label: "Back to sign in" },
    children: <LoginCard />,
  },
};

export const Mobile: Story = {
  args: { children: <LoginCard /> },
  globals: { viewport: { value: "iphoneSE" } },
};
