import type { Metadata, Viewport } from "next";

import {
  clerkLocalizationConfig,
  customFonts,
  metadataConfig,
  viewportConfig,
} from "@/config";
import { ClerkProvider } from "@clerk/nextjs";
import "@rainbow-me/rainbowkit/styles.css";

import { cn } from "@/lib/cn";

import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";

const { laroSoft, dmSans, montserrat } = customFonts;

export const metadata: Metadata = metadataConfig;
export const viewport: Viewport = viewportConfig;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={clerkLocalizationConfig}>
      <html lang="en" suppressHydrationWarning data-theme="dark">
        <body
          className={cn(
            laroSoft.variable,
            dmSans.variable,
            montserrat.variable,
            "font-sans antialiased min-h-screen bg-brand-bg"
          )}
        >
          <Providers>
            <Navbar />
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
