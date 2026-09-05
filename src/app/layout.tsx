import type { Metadata, Viewport } from "next";
import { Source_Serif_4, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const inter = Inter({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["500"],
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
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
  themeColor: "#6C63FF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
