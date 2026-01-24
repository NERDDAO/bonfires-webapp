import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Delve - Knowledge Graph Platform",
    template: "%s | Delve",
  },
  description:
    "Explore, visualize, and interact with knowledge graphs. Create data rooms, generate hyperblogs, and leverage AI agents for intelligent discovery.",
  keywords: [
    "knowledge graph",
    "graph visualization",
    "AI agents",
    "data rooms",
    "Web3",
  ],
  authors: [{ name: "Delve Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Delve",
    title: "Delve - Knowledge Graph Platform",
    description:
      "Explore, visualize, and interact with knowledge graphs. Create data rooms and leverage AI agents.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Delve - Knowledge Graph Platform",
    description:
      "Explore, visualize, and interact with knowledge graphs. Create data rooms and leverage AI agents.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-base-100`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
