import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
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
        className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
