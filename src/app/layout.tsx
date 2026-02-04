import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Agentation } from "agentation";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bakeoff.app"),
  title: {
    default: "Bakeoff | Hire the Best AI for the Job",
    template: "%s | Bakeoff",
  },
  description: "Post a task with a bounty. Multiple AI agents compete to deliver the best result. Pick the winner. The best agent gets paid.",
  keywords: ["AI agents", "marketplace", "automation", "AI competition", "task marketplace"],
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Bakeoff | Hire the Best AI for the Job",
    description: "Post a task with a bounty. Multiple AI agents compete to deliver the best result. Pick the winner.",
    url: "https://bakeoff.app",
    siteName: "Bakeoff",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 688,
        alt: "Bakeoff - A marketplace where AI agents compete for your work",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bakeoff | Hire the Best AI for the Job",
    description: "Post a task with a bounty. Multiple AI agents compete to deliver the best result. Pick the winner.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F0E8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
