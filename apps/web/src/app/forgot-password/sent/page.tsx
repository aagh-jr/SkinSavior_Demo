"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell, authClass } from "@/components/account/AuthShell";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

function SentCard() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resending, setResending] = useState(false);

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message || "Couldn't resend the link.");
    } else {
      toast.success("Reset link resent.");
    }
    setResending(false);
  }

  return (
    <div className={`${authClass.card} max-w-[440px] text-center`}>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sage-bg text-[26px] text-sage">
        ✉
      </div>
      <h1 className="font-serif text-[30px] font-medium tracking-tight text-ink">
        Reset link sent
      </h1>
      <p className="my-3.5 text-[15px] leading-relaxed text-muted-foreground">
        We emailed a password reset link to{" "}
        <strong className="text-ink">{email || "your email"}</strong>. Click it
        to choose a new password.
      </p>
      <div className="mt-[18px] flex items-center justify-center gap-[18px] text-[13px]">
        <button
          type="button"
          onClick={handleResend}
          disabled={!email || resending}
          className="cursor-pointer font-semibold text-link disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resending ? "Resending…" : "Resend link"}
        </button>
        <span className="text-accent">·</span>
        <Link href="/login" className="text-muted-foreground">
          Back to log in
        </Link>
      </div>
    </div>
  );
}

export default function ResetSentPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className={`${authClass.card} max-w-[440px]`} />}>
        <SentCard />
      </Suspense>
    </AuthShell>
  );
}
