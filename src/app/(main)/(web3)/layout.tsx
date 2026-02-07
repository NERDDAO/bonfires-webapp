/**
 * Web3 Route Group Layout
 *
 * Layout for all Web3 features: Data Rooms, HyperBlogs, x402 Chat, x402 Delve.
 * Includes wallet connection indicators and Web3-specific navigation.
 */
import type { ReactNode } from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Web3 Features",
    template: "%s | Delve Web3",
  },
  description:
    "Access payment-gated knowledge graph features including Data Rooms, HyperBlogs, and AI chat.",
};

interface Web3LayoutProps {
  children: ReactNode;
}

export default function Web3Layout({ children }: Web3LayoutProps) {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
