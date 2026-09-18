import { redirect } from "next/navigation";

// Public entry must never mint a shared authenticated session. Profiles contain
// private health disclosures; visitors sign in to their own accounts instead.
export default function IndexPage() {
  redirect("/landing");
}
