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
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("buildbase-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme:dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className="min-h-full antialiased bg-bg-base text-content-primary"
        style={{
          fontFamily: "var(--font-inter, Inter, sans-serif)",
        }}
      >
        {children}
        <Analytics />
        <Toaster
          theme="system"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-subtle)",
              color: "var(--color-content-primary)",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            },
          }}
        />
      </body>
    </html>
  );
}
