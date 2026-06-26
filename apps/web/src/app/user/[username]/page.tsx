import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Database } from "@skinsavior/core/supabase";
import { SiteNav } from "@/components/SiteNav";
import { createClient } from "@/lib/supabase/server";

// Columns that actually exist on the live `profiles` table.
const PROFILE_SELECT = "display_name, username, skin_type, bio, avatar_url";

type ProfileCard = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "display_name" | "username" | "skin_type" | "bio" | "avatar_url"
>;

async function getProfileByUsername(
  username: string,
): Promise<ProfileCard | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("username", username)
    .maybeSingle();
  // The typed client resolves relational selects to `never` under this
  // postgrest version; assert the row shape we explicitly selected.
  return (data as ProfileCard | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Profile not found" };
  const name = profile.display_name ?? `@${profile.username}`;
  return {
    title: `${name} · skinsavior`,
    description: `${name}'s skin profile on skinsavior.`,
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const name = profile.display_name ?? `@${profile.username}`;
  const initial = (profile.display_name ?? profile.username ?? "?")
    .charAt(0)
    .toUpperCase();
  // Guard against empty / literal "NULL" strings stored in the column.
  const avatarUrl =
    profile.avatar_url && profile.avatar_url.toUpperCase() !== "NULL"
      ? profile.avatar_url
      : null;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-[1180px] px-6 py-12 md:px-14">
        <div className="flex items-center gap-5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary font-serif text-2xl font-semibold text-ink">
              {initial}
            </div>
          )}
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              {name}
            </h1>
            <p className="mt-1 text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink/80">
            {profile.bio}
          </p>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-ink">Profile</h2>
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Name</span>
                <p className="text-ink">{profile.display_name ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Username</span>
                <p className="text-ink">@{profile.username}</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Skin Type</span>
                <p className="text-ink">{profile.skin_type ?? "Not yet provided"}</p>
              </div>
            </div>
          </div>

          {/* Skin Analysis Card — awaiting quiz-backed columns on `profiles` */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-ink">Skin Analysis</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              No skin analysis yet. Once the quiz answers are stored on the
              profile, sensitivity, concerns, and goals will appear here.
            </p>
          </div>

          {/* Saved Products Card — awaiting a saved-products relation */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-ink">Saved Products</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              No saved products yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
