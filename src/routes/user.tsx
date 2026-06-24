import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/user")({
  component: UserPage,
});

function UserPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-[1180px] px-6 py-12 md:px-14">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          Account
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile, skin analysis, and preferences.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-ink">Profile</h2>
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Name</span>
                <p className="text-ink">Alex Doe</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Email</span>
                <p className="text-ink">alex@example.com</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Skin Type</span>
                <p className="text-ink">Combination — Oily T-zone</p>
              </div>
            </div>
          </div>

          {/* Skin Analysis Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-ink">Skin Analysis</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sensitivity</span>
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">Mild</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Acne Prone</span>
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">Occasional</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Concern</span>
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">Brightening</span>
              </div>
            </div>
          </div>

          {/* Saved Products Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-ink">Saved Products</h2>
            <ul className="mt-4 space-y-2">
              <li className="rounded-xl bg-muted px-4 py-3 text-sm text-ink">Radiance Vitamin C Serum</li>
              <li className="rounded-xl bg-muted px-4 py-3 text-sm text-ink">Calming Centella Toner</li>
              <li className="rounded-xl bg-muted px-4 py-3 text-sm text-ink">Barrier Restore Cream</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
