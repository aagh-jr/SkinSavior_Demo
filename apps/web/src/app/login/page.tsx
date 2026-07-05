"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, authClass } from "@/components/account/AuthShell";
import { PasswordField } from "@/components/account/PasswordField";
import { supabase } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Where to land after signing in. Only allow same-app paths to avoid an
  // open-redirect via a crafted ?next=… value.
  const rawNext = searchParams.get("next") ?? "/home";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | "email" | "google" | "apple">(null);
  const [error, setError] = useState<string | null>(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading("email");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(null);
      return;
    }
    // Refresh so the server components pick up the new session cookie, then go.
    router.push(next);
    router.refresh();
  }

  async function handleOAuth(provider: "google" | "apple") {
    if (loading) return;
    setError(null);
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${next}` },
    });
    if (error) {
      setError(error.message || `Couldn't sign in with ${provider}.`);
      setLoading(null);
    }
    // On success the browser is redirected to the provider.
  }

  const busy = loading !== null;

  return (
    <div className={`${authClass.card} max-w-[430px]`}>
      <h1 className="font-serif text-[30px] font-medium tracking-tight text-ink">
        Welcome back.
      </h1>
      <p className="mb-[22px] mt-2 text-[14px] text-muted-foreground">
        Log in to see your matches and saved products.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => handleOAuth("google")}
          className="flex items-center justify-center gap-2 rounded-[11px] border border-border bg-white px-3 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-[#faf6ee] disabled:opacity-50"
        >
          <span className="inline-block h-4 w-4 rounded-full bg-[#4285F4]" />
          Google
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => handleOAuth("apple")}
          className="flex items-center justify-center gap-2 rounded-[11px] border border-ink bg-ink px-3 py-3 text-[14px] font-semibold text-warm-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Apple
        </button>
      </div>

      <div className="mb-5 flex items-center gap-3.5">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          or with email
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleEmail}>
        <div className="mb-3.5">
          <label className={authClass.label} htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className={authClass.input}
          />
        </div>
        <PasswordField
          placeholder="Your password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={busy}
        />
        <div className="mb-[18px] text-right">
          <Link href="/forgot-password" className="text-[13px] font-semibold text-clay">
            Forgot password?
          </Link>
        </div>

        {error ? (
          <div className="mb-3.5 rounded-[10px] border border-destructive/40 bg-[#fdf1ee] px-3.5 py-2.5 text-[13px] text-destructive">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className={`${authClass.primaryBtn} disabled:opacity-60`}
        >
          {loading === "email" ? "Signing in…" : "Log in →"}
        </button>
      </form>

      <div className="mt-[18px] text-center text-[13px] text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-clay">
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell back={{ href: "/", label: "← Back to home" }}>
      {/* useSearchParams needs a Suspense boundary for static rendering. */}
      <Suspense fallback={<div className={`${authClass.card} max-w-[430px]`} />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
