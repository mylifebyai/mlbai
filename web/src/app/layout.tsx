import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { AppsLauncher } from "./components/AppsLauncher";
import { AnalyticsReporter } from "./components/AnalyticsReporter";
import { FeedbackButton } from "./components/FeedbackButton";
import { AnalyticsButton } from "./components/AnalyticsButton";
import { AppProviders } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Life, By AI – A ChatGPT Life Coach Documentary",
  description:
    "Follow a real, messy, transparent experiment in rebuilding life with a non-judgmental AI coach—systems over shame, straight from YouTube.",
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
        <AppProviders>
          <Suspense fallback={null}>
            <AnalyticsReporter />
          </Suspense>
          {children}
          <AppsLauncher />
          <AnalyticsButton />
          <FeedbackButton />
        </AppProviders>
      </body>
    </html>
  );
}
