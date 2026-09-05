import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import { GoogleAnalytics } from "@/components/google-analytics";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const siteUrl = "https://formatexcel.online";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FormatExcel | AI Excel Formatter, Manifest Extractor & Mail Merge",
    template: "%s | FormatExcel",
  },
  description:
    "Automate your Excel files in seconds. Format spreadsheets, extract manifests, and send personalized mail merges effortlessly. Try it free!",
  applicationName: "FormatExcel",
  keywords: [
    "Excel formatter",
    "mail merge",
    "manifest extractor",
    "spreadsheet automation",
    "FormatExcel",
  ],
  authors: [{ name: "FormatExcel.online" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["es_ES"],
    url: siteUrl,
    siteName: "FormatExcel.online",
    title: "FormatExcel | AI Excel Formatter, Manifest Extractor & Mail Merge",
    description:
      "Automate your Excel files in seconds. Format spreadsheets, extract manifests, and send personalized mail merges effortlessly. Try it free!",
  },
  twitter: {
    card: "summary_large_image",
    title: "FormatExcel | AI Excel Formatter, Manifest Extractor & Mail Merge",
    description:
      "Automate your Excel files in seconds. Format spreadsheets, extract manifests, and send personalized mail merges effortlessly. Try it free!",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
  manifest: "/site.webmanifest",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <GoogleAnalytics />
        <AppProviders>
          <SiteHeader />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
