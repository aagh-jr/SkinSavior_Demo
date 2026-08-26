"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell, authClass } from "@/components/account/AuthShell";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/forgot-password/sent?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <AuthShell>
      <div className={`${authClass.card} max-w-[430px]`}>
        <h1 className="font-serif text-[30px] font-medium tracking-tight text-ink">
          Forgot your password?
        </h1>
        <p className="mb-[22px] mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
          No problem. Enter the email on your account and we&apos;ll send a link
          to reset it.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className={authClass.label} htmlFor="forgot-email">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              placeholder="you@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={authClass.input}
            />
          </div>

          {error ? (
            <div className="mb-3.5 rounded-[10px] border border-destructive/40 bg-[#fdf1ee] px-3.5 py-2.5 text-[13px] text-destructive">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className={`${authClass.primaryBtn} disabled:opacity-60`}
          >
            {loading ? "Sending…" : "Send reset link →"}
          </button>
        </form>
        <div className="mt-[18px] text-center text-[13px]">
          <Link href="/login" className="text-muted-foreground">
            ← Back to log in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
