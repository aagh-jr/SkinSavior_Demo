import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteNavView } from "./SiteNavView";
import {
  signedInSession,
  signedInNoAvatarSession,
  signedOutSession,
  loadingSession,
} from "@/fixtures/user.fixtures";

/**
 * Presentational nav. Session state arrives via props (see useSession), so all
 * auth states are drivable here without touching Supabase.
 */
const meta: Meta<typeof SiteNavView> = {
  title: "Nav/SiteNavView",
  component: SiteNavView,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof SiteNavView>;

export const SignedIn: Story = { args: signedInSession };

/** Signed in, no chosen avatar → generic user glyph. */
export const SignedInNoAvatar: Story = { args: signedInNoAvatarSession };

export const SignedOut: Story = { args: signedOutSession };

/** Session still resolving. */
export const Loading: Story = { args: loadingSession };

export const Mobile: Story = {
  args: signedInSession,
  globals: { viewport: { value: "iphoneSE" } },
};
