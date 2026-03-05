"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";

import { QueryProvider } from "@/contexts";

import { ToastProvider } from "@/components/common";
import { useWalletOrgLink } from "@/hooks/useWalletOrgLink";

/**
 * Dynamically imported Web3Provider — loaded client-side only.
 * This prevents WalletConnect's IndexedDB usage from crashing during SSR/SSG.
 */
const Web3Provider = dynamic(
  () =>
    import("@/contexts/Web3Provider").then((mod) => mod.Web3Provider),
  { ssr: false }
);

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Runs the wallet-org auto-link after sign-in inside the provider tree
 * where both Clerk and Wagmi contexts are available.
 */
function WalletOrgLinker({ children }: { children: ReactNode }) {
  useWalletOrgLink();
  return <>{children}</>;
}

/**
 * Provider hierarchy for the entire application.
 *
 * Order matters:
 * 1. QueryProvider - React Query for server state management
 * 2. Web3Provider - Wagmi + RainbowKit for wallet connections (client-only)
 * 3. WalletOrgLinker - auto-join Clerk orgs for wallet owners
 * 4. ToastProvider - Toast notifications (react-hot-toast)
 *
 * Note: Web3Provider has its own internal QueryClient for Web3-specific queries.
 * The outer QueryProvider handles all other API queries.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <Web3Provider>
        <WalletOrgLinker>
          {children}
        </WalletOrgLinker>
        <ToastProvider />
      </Web3Provider>
    </QueryProvider>
  );
}
