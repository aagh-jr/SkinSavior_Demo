import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// `/user` resolves to the signed-in user's own public profile at
// `/user/[username]`. Signed-out visitors are sent to the quiz to create one.
export default async function UserIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/quiz");

  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as { username: string | null } | null;
  if (profile?.username) redirect(`/user/${profile.username}`);

  // Signed in but no username set yet — nothing to show publicly.
  redirect("/quiz");
}
