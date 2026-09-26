import type { Metadata } from "next";
import { Newsreader, Hanken_Grotesk, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";
import { Providers } from "@/components/providers";

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "skinsavior — Your skin, finally explained.",
    template: "%s · skinsavior",
  },
  description:
    "Skincare ingredient transparency with complete INCI lists, evidence context, and deterministic routine checks.",
  openGraph: {
    title: "skinsavior — Your skin, finally explained.",
    description:
      "Skincare ingredient transparency with complete INCI lists, evidence context, and deterministic routine checks.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${hanken.variable} ${spaceGrotesk.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
