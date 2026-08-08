import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "skinsavior — demo",
  description: "Enter the skinsavior demo.",
};

// The account the demo signs you into. Override with DEMO_ACCOUNT_EMAIL in the
// environment without touching code. The real marketing landing lives at
// /landing (see src/app/landing/page.tsx).
const DEMO_EMAIL = process.env.DEMO_ACCOUNT_EMAIL ?? "gonzalez.abel2003@gmail.com";

// Server action: mint a genuine session for the demo account and drop the
// visitor into the logged-in app. Uses the service-role admin client to create
// a one-time magic-link token, then verifies it to set the session cookie — no
// password required, and the service-role key never leaves the server.
async function enterDemo() {
  "use server";

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: DEMO_EMAIL,
  });
  if (error || !data?.properties?.hashed_token) {
    throw new Error(error?.message ?? "Could not create the demo session.");
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: data.properties.hashed_token,
  });
  if (verifyError) throw new Error(verifyError.message);

  // Session cookie is now set — land on the personalized home.
  redirect("/home");
}

export default function DemoSplash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <span className="mb-10 font-serif text-lg font-semibold text-ink">
        skinsavior
      </span>

      <h1 className="font-serif text-4xl font-medium leading-[1.05] tracking-tight text-ink text-balance md:text-5xl">
        Welcome to the skin savior demo
      </h1>

      <form action={enterDemo} className="mt-10">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-10 py-4 text-base font-bold text-primary-foreground transition-colors hover:opacity-90"
        >
          Enter <span className="text-lg">→</span>
        </button>
      </form>

      <a
        href="/landing"
        className="mt-6 text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-ink"
      >
        View the marketing page
      </a>
    </div>
  );
}
