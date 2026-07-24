import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "KYL Arena",
    template: "%s — KYL Arena",
  },
  description: "Stop checking Strava profiles manually. Create fitness challenges, track participants automatically, and manage your entire community from a single dashboard.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

import { PageLoaderProvider } from "@/components/PageLoader";
import { ToastProvider } from "@/components/Toast";
import SmoothScroll from "@/components/SmoothScroll";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <PageLoaderProvider>
            <SmoothScroll>
              {children}
            </SmoothScroll>
          </PageLoaderProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
