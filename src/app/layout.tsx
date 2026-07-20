import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | QFlow",
    default: "QFlow - Virtual Queue System",
  },
  description:
    "QR Code-based virtual queue with gamification. Eliminate waiting lines and engage customers.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "QFlow - Virtual Queue System",
    description:
      "QR Code-based virtual queue with gamification. Eliminate waiting lines and engage customers.",
    siteName: "QFlow",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "QFlow - Virtual Queue System",
    description:
      "QR Code-based virtual queue with gamification. Eliminate waiting lines and engage customers.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
