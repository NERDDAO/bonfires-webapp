"use client";

import type { ReactNode } from "react";
import { QueryProvider, Web3Provider } from "@/contexts";
import { ToastProvider } from "@/components/common";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Provider hierarchy for the entire application.
 *
 * Order matters:
 * 1. QueryProvider - React Query for server state management
 * 2. Web3Provider - Wagmi + RainbowKit for wallet connections
 * 3. ToastProvider - Toast notifications (react-hot-toast)
 *
 * Note: Web3Provider has its own internal QueryClient for Web3-specific queries.
 * The outer QueryProvider handles all other API queries.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <Web3Provider>
        {children}
        <ToastProvider />
      </Web3Provider>
    </QueryProvider>
  );
}
