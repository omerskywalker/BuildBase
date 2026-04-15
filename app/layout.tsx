import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://buildbase.io";

export const metadata: Metadata = {
  title: "BuildBase — Structured Fitness Coaching",
  description:
    "A structured fitness coaching platform for coaches and individuals. Program, track, and progress with purpose.",
  keywords: ["fitness", "coaching", "strength training", "workout tracker"],
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "BuildBase — Structured Fitness Coaching",
    description:
      "A structured fitness coaching platform for coaches and individuals. Program, track, and progress with purpose.",
    url: APP_URL,
    siteName: "BuildBase",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildBase — Structured Fitness Coaching",
    description:
      "A structured fitness coaching platform for coaches and individuals. Program, track, and progress with purpose.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body
        className="min-h-full antialiased"
        style={{
          background: "#0F1A14",
          color: "#E8F0E8",
          fontFamily: "var(--font-inter, Inter, sans-serif)",
        }}
      >
        {children}
        <Analytics />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1C2A20",
              border: "1px solid #2A3D30",
              color: "#E8F0E8",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            },
          }}
        />
      </body>
    </html>
  );
}
