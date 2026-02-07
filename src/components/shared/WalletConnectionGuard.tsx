"use client";

/**
 * WalletConnectionGuard Component
 *
 * Displays a connection prompt when wallet is not connected.
 * Used to guard Web3 features that require wallet connection.
 */
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface WalletConnectionGuardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  isConnected: boolean;
}

export function WalletConnectionGuard({
  title = "Connect Your Wallet",
  description = "Please connect your wallet to continue.",
  children,
  isConnected,
}: WalletConnectionGuardProps) {
  if (isConnected) {
    return <>{children}</>;
  }

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body items-center text-center">
        <h2 className="card-title">{title}</h2>
        <p className="opacity-70 mb-4">{description}</p>
        <ConnectButton />
      </div>
    </div>
  );
}
