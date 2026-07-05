import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell, authClass } from "@/components/account/AuthShell";

export const metadata: Metadata = { title: "Reset link sent" };

export default function ResetSentPage() {
  return (
    <AuthShell>
      <div className={`${authClass.card} max-w-[440px] text-center`}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sage-bg text-[26px] text-sage">
          ✉
        </div>
        <h1 className="font-serif text-[30px] font-medium tracking-tight text-ink">
          Reset link sent
        </h1>
        <p className="my-3.5 text-[15px] leading-relaxed text-muted-foreground">
          We emailed a password reset link to{" "}
          <strong className="text-ink">alex@email.com</strong>. The link expires
          in 30 minutes.
        </p>
        <Link
          href="/reset-password"
          className={authClass.primaryBtn + " inline-block"}
        >
          Open the reset link →
        </Link>
        <div className="mt-[18px] flex items-center justify-center gap-[18px] text-[13px]">
          <span className="cursor-pointer font-semibold text-clay">
            Resend link
          </span>
          <span className="text-accent">·</span>
          <Link href="/login" className="text-muted-foreground">
            Back to log in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
