"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { supabase } from "@/lib/supabase/client";

const AVATAR_COLORS = [
  "#caa37f",
  "#9a4a2f",
  "#4a6b3f",
  "#7a93a8",
  "#c98a9b",
  "#8a7bb0",
];

const SKIN_TYPES = ["Dry", "Normal", "Combo", "Oily"];

const cardClass = "rounded-[16px] border border-border bg-white p-6";
const inputClass =
  "w-full box-border rounded-[11px] border border-border bg-white px-3.5 py-3 text-[15px] text-ink outline-none transition-colors focus:border-clay";

type ProfileRow = {
  display_name: string | null;
  username: string | null;
  bio: string | null;
  skin_type: string | null;
  avatar_url: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const [avatar, setAvatar] = useState(AVATAR_COLORS[0]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [skin, setSkin] = useState("Dry");
  const initial = (name || "?").charAt(0).toUpperCase();

  // Uploaded profile photo. When set it overrides the color/initial avatar and
  // is what the nav icon and public profile show.
  const [userId, setUserId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Save-changes state for the profile fields (name / username / bio / skin).
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Load the signed-in user and their existing profile so the form reflects
  // what's actually in the DB (not placeholder copy).
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user) {
        if (active) setLoaded(true);
        return;
      }
      setUserId(data.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, username, bio, skin_type, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!active) return;
      const p = profile as ProfileRow | null;
      if (p) {
        // Fall back to the email local-part for the display name, matching the
        // handle_new_user() default, so the field is never blank.
        setName(p.display_name ?? data.user.email?.split("@")[0] ?? "");
        setUsername(p.username ?? "");
        if (p.bio) setBio(p.bio);
        if (p.skin_type) setSkin(p.skin_type);
        const url = p.avatar_url;
        if (url && url.toUpperCase() !== "NULL") setPhotoUrl(url);
      } else {
        setName(data.user.email?.split("@")[0] ?? "");
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    if (saving) return;
    setSaveError(null);
    if (!userId) {
      setSaveError("Sign in to save your profile.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          id: userId,
          display_name: name.trim() || null,
          username: username.trim() || null,
          bio: bio.trim() || null,
          skin_type: skin,
        } as never,
        { onConflict: "id" },
      );
      if (error) throw error;
      router.push("/user");
      router.refresh();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Couldn't save. Please try again.",
      );
      setSaving(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setUploadError(null);

    if (!userId) {
      setUploadError("Sign in to upload a profile photo.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5 MB.");
      return;
    }

    setUploading(true);
    try {
      // Store under the user's own `{uid}/…` prefix — required by the
      // avatars bucket RLS. A timestamped name avoids stale CDN caching.
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      // Self-upsert: some accounts predate the profiles trigger, so the row may
      // not exist yet. Upsert keeps this robust either way.
      const { error: dbErr } = await supabase
        .from("profiles")
        .upsert(
          { id: userId, avatar_url: publicUrl } as never,
          { onConflict: "id" },
        );
      if (dbErr) throw dbErr;

      setPhotoUrl(publicUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handlePhotoRemove() {
    if (!userId) {
      setPhotoUrl(null);
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { id: userId, avatar_url: null } as never,
          { onConflict: "id" },
        );
      if (error) throw error;
      setPhotoUrl(null);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Couldn't remove photo.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <SiteNav />
      <main className="mx-auto w-full max-w-[720px] px-12 py-11">
        <h1 className="font-serif text-[34px] font-medium tracking-tight text-ink">
          Edit profile &amp; settings
        </h1>
        <p className="mb-7 mt-2 text-[14px] text-muted-foreground">
          Update how you appear and how we tune your matches.
        </p>

        {/* Avatar */}
        <div className={`${cardClass} mb-[18px]`}>
          <h2 className="mb-4 font-serif text-[18px] font-semibold text-ink">
            Avatar
          </h2>
          <div className="flex flex-wrap items-center gap-[18px]">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Your profile photo"
                className="h-[72px] w-[72px] flex-shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-full font-serif text-[30px] font-semibold text-white"
                style={{ background: avatar }}
              >
                {initial}
              </div>
            )}
            <div className="min-w-[220px] flex-1">
              <div className="mb-2 text-xs text-muted-foreground">
                Upload a photo, or pick a color
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-[9px] bg-ink px-3.5 py-2.5 text-[13px] font-semibold text-warm-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {uploading ? "Uploading…" : photoUrl ? "↑ Change photo" : "↑ Upload photo"}
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={handlePhotoRemove}
                    className="rounded-[9px] border border-border px-3.5 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-background disabled:opacity-60"
                  >
                    Remove
                  </button>
                )}
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Pick ${c}`}
                    onClick={() => setAvatar(c)}
                    className="h-[38px] w-[38px] flex-shrink-0 rounded-full"
                    style={{
                      background: c,
                      border: `3px solid ${avatar === c ? "#1d1812" : "#f0e8da"}`,
                    }}
                  />
                ))}
              </div>
              {uploadError && (
                <div className="mt-2 text-xs text-destructive">{uploadError}</div>
              )}
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <div className={`${cardClass} mb-[18px]`}>
          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">
              Display name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">
              Username
            </label>
            <div className="flex items-center rounded-[11px] border border-border bg-white px-3.5">
              <span className="text-[15px] text-muted-foreground">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="flex-1 border-none bg-transparent px-1.5 py-3 text-[15px] text-ink outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink">
              Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={`${inputClass} resize-y leading-relaxed`}
            />
          </div>
        </div>

        {/* Skin profile */}
        <div className={`${cardClass} mb-[18px]`}>
          <h2 className="mb-3.5 font-serif text-[18px] font-semibold text-ink">
            Skin profile
          </h2>
          <div className="mb-2 text-[13px] font-semibold text-ink">Skin type</div>
          <div className="mb-[18px] flex flex-wrap gap-2">
            {SKIN_TYPES.map((t) => {
              const active = skin === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSkin(t)}
                  className={
                    "rounded-full border px-3.5 py-[7px] text-[13px] " +
                    (active
                      ? "border-clay bg-secondary font-semibold text-clay"
                      : "border-border text-muted-foreground")
                  }
                >
                  {t}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-[#f0e8da] pt-[18px]">
            <div>
              <div className="text-[14px] font-semibold text-ink">
                Your matches come from your quiz answers
              </div>
              <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                Last taken 3 weeks ago · 12 questions
              </div>
            </div>
            <Link
              href="/quiz?retake=1"
              className="rounded-[10px] border border-accent px-4 py-2.5 text-[13px] font-semibold text-clay transition-colors hover:bg-[#fff7ea]"
            >
              Retake quiz
            </Link>
          </div>
        </div>

        {saveError && (
          <div className="mb-3 rounded-[10px] border border-destructive/40 bg-[#fdf1ee] px-3.5 py-2.5 text-[13px] text-destructive">
            {saveError}
          </div>
        )}
        <div className="mb-6 flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !loaded}
            className="rounded-[11px] bg-primary px-6 py-3 text-[15px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <Link
            href="/user"
            className="rounded-[11px] border border-border px-6 py-3 text-[15px] font-semibold text-muted-foreground transition-colors hover:bg-background"
          >
            Cancel
          </Link>
        </div>

        <div className="flex items-center gap-5 border-t border-border pt-5">
          <span className="cursor-pointer text-[13px] font-semibold text-muted-foreground">
            Log out
          </span>
          <span className="cursor-pointer text-[13px] font-semibold text-destructive">
            Delete account
          </span>
        </div>
      </main>
    </>
  );
}
