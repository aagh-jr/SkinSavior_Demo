"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell, authClass } from "@/components/account/AuthShell";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

function VerifyCard() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resending, setResending] = useState(false);

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      toast.error(error.message || "Couldn't resend the email.");
    } else {
      toast.success("Confirmation email resent.");
    }
    setResending(false);
  }

  return (
    <div className={`${authClass.card} max-w-[448px] text-center`}>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sage-bg text-[26px] text-sage">
        ✉
      </div>
      <h1 className="font-serif text-[30px] font-medium tracking-tight text-ink">
        Check your inbox
      </h1>
      <p className="my-3.5 text-[15px] leading-relaxed text-muted-foreground">
        We sent a confirmation link to{" "}
        <strong className="text-ink">{email || "your email"}</strong>. Click it
        to activate your account and unlock your matches.
      </p>
      <Link href="/login" className={authClass.primaryBtn + " inline-block"}>
        I&apos;ve confirmed — log in →
      </Link>
      <div className="mt-[18px] flex items-center justify-center gap-[18px] text-[13px]">
        <button
          type="button"
          onClick={handleResend}
          disabled={!email || resending}
          className="cursor-pointer font-semibold text-link disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resending ? "Resending…" : "Resend email"}
        </button>
        <span className="text-accent">·</span>
        <Link href="/signup" className="text-muted-foreground">
          Change email
        </Link>
      </div>
      <p className="mt-[22px] text-xs leading-relaxed text-muted-foreground">
        Didn&apos;t get it? Check your spam folder, or resend the link above.
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className={`${authClass.card} max-w-[448px]`} />}>
        <VerifyCard />
      </Suspense>
    </AuthShell>
  );
}
