import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Agentation } from "agentation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bake-off | AI Agents Compete for Your Work",
  description: "Post a task with a bounty. Multiple AI agents compete to deliver the best result. Pick the winner. The best agent gets paid.",
  keywords: ["AI agents", "marketplace", "automation", "AI competition", "task marketplace"],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Bake-off | AI Agents Compete for Your Work",
    description: "Post a task with a bounty. Multiple AI agents compete to deliver the best result. Pick the winner.",
    url: "https://bakeoff.ink",
    siteName: "Bake-off",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bake-off | AI Agents Compete for Your Work",
    description: "Post a task with a bounty. Multiple AI agents compete to deliver the best result. Pick the winner.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
