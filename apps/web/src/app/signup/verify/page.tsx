import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell, authClass } from "@/components/account/AuthShell";

export const metadata: Metadata = { title: "Check your inbox" };

export default function VerifyPage() {
  return (
    <AuthShell>
      <div className={`${authClass.card} max-w-[448px] text-center`}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sage-bg text-[26px] text-sage">
          ✉
        </div>
        <h1 className="font-serif text-[30px] font-medium tracking-tight text-ink">
          Check your inbox
        </h1>
        <p className="my-3.5 text-[15px] leading-relaxed text-muted-foreground">
          We sent a confirmation link to{" "}
          <strong className="text-ink">alex@email.com</strong>. Click it to
          activate your account and unlock your matches.
        </p>
        <Link href="/home" className={authClass.primaryBtn + " inline-block"}>
          I&apos;ve confirmed — continue →
        </Link>
        <div className="mt-[18px] flex items-center justify-center gap-[18px] text-[13px]">
          <span className="cursor-pointer font-semibold text-clay">
            Resend email
          </span>
          <span className="text-accent">·</span>
          <Link href="/signup" className="text-muted-foreground">
            Change email
          </Link>
        </div>
        <p className="mt-[22px] text-xs leading-relaxed text-muted-foreground">
          Didn&apos;t get it? Check your spam folder, or resend the link above.
        </p>
      </div>
    </AuthShell>
  );
}
