import { redirect } from "next/navigation";

// /saved was a mock: React state over three hardcoded demo products, with no
// table behind it. Saving is now real (saved_products) and lives on the shelf
// alongside the products you actually use, so this route just forwards.
export default function SavedPage() {
  redirect("/shelf");
}
