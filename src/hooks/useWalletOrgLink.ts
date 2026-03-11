"use client";

/**
 * useWalletOrgLink
 *
 * After Clerk sign-in, checks if the user has a Web3 wallet and
 * auto-joins them to any Clerk orgs linked to that wallet address
 * via bonfire provisioning.
 *
 * Runs once per session after the user is signed in with a Web3 wallet.
 */
import { useEffect, useRef } from "react";

import { useUser } from "@clerk/nextjs";
import { useAccount } from "wagmi";

interface WalletOrgLinkResult {
  clerk_org_id: string;
  bonfire_id: string;
  slug: string | null;
}

export function useWalletOrgLink(): void {
  const { user, isSignedIn, isLoaded } = useUser();
  const { address, isConnected } = useAccount();
  const linkedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || linkedRef.current) return;

    const walletAddress =
      address ??
      user?.primaryWeb3Wallet?.web3Wallet;

    if (!walletAddress) return;

    linkedRef.current = true;

    fetch("/api/auth/wallet-org-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: walletAddress }),
    })
      .then(async (res) => {
        if (!res.ok) {
          linkedRef.current = false;
          return;
        }
        const data = (await res.json()) as { orgs_joined: WalletOrgLinkResult[] };
        if (data.orgs_joined.length > 0) {
          user?.reload();
        }
      })
      .catch(() => {
        linkedRef.current = false;
      });
  }, [isLoaded, isSignedIn, user, address, isConnected]);
}
