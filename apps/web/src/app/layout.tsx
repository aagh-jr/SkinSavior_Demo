import type { Metadata } from "next";
import { Newsreader, Hanken_Grotesk, Space_Grotesk } from "next/font/google";

import "./globals.css";
import { Providers } from "@/components/providers";
import { DevNavigator } from "@/components/DevNavigator";

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
    "AI-powered skincare transparency. Personalized matches backed by real research.",
  openGraph: {
    title: "skinsavior — Your skin, finally explained.",
    description:
      "AI-powered skincare transparency. Personalized matches backed by real research.",
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
        <DevNavigator />
      </body>
    </html>
  );
}
