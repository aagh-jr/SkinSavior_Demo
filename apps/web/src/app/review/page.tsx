import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { ReviewQueue } from "@/components/research/ReviewQueue";
import { isAdminUser } from "@/lib/admin";
import { listPendingStudies } from "@/lib/review-db";

// Curation queue for grade-flipping extracted studies — the web home of
// scripts/review-studies.mjs. Admin-only (ADMIN_EMAILS allowlist); everyone
// else gets a 404 so the route stays invisible.

export const metadata: Metadata = { title: "Study review" };

export default async function ReviewPage() {
  if (!(await isAdminUser())) notFound();

  const studies = await listPendingStudies();

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-[820px] px-6 py-12 md:px-12 md:py-16">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">
          Study review
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Extracted studies that would move a claim&apos;s grade wait here until a
          person approves them. Approving re-grades the affected claims; rejecting
          removes the study entirely.
        </p>
        <div className="mt-8">
          <ReviewQueue studies={studies} />
        </div>
      </main>
    </div>
  );
}
