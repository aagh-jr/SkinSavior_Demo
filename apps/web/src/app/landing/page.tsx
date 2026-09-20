import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { HookSection } from "@/components/landing/HookSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTASurvey } from "@/components/landing/CTASurvey";
import { Footer } from "@/components/landing/Footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "skinsavior — Your skin, finally explained.",
  description:
    "Decode complete ingredient lists, inspect the evidence, and check the products in your routine for documented conflicts.",
};

export default async function LandingPage() {
  // Signed-in users going "home" should land on their personalized home, not
  // this logged-out marketing screen.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main>
        <Hero />
        <HookSection />
        <HowItWorks />
        <CTASurvey />
      </main>
      <Footer />
    </div>
  );
}
