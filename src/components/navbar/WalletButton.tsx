"use client";

import { useBalance, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState, useRef, useEffect } from "react";
import { isE2EWalletEnabled, setE2EWalletState, useE2EBalance, useWalletAccount } from "@/lib/wallet/e2e";

interface WalletButtonProps {
  /** Whether to show balance in the expanded view */
  showBalance?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * WalletButton Component
 *
 * A subtle wallet indicator that expands to show connection status and balance.
 * Uses RainbowKit for wallet connection UI.
 *
 * Features:
 * - Subtle icon when connected
 * - Click to show dropdown with details
 * - Connect button when disconnected
 * - Address truncation
 * - Balance display
 */
export function WalletButton({
  showBalance = true,
  className = "",
}: WalletButtonProps) {
  const { address, isConnected, isConnecting } = useWalletAccount();
  const e2eBalance = useE2EBalance();
  const { data: balanceData } = useBalance({
    address: address as `0x${string}` | undefined,
  });
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const [isOpen, setIsOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch by only showing dynamic content after mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format address for display
  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  // Format balance for display
  const balance = isE2EWalletEnabled() ? e2eBalance : balanceData;
  const formattedBalance = balance
    ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol ?? "ETH"}`
    : "0.0000 ETH";

  // Not connected state - use hasMounted to prevent hydration mismatch
  if (!isConnected) {
    // Show consistent state during SSR/hydration
    const showLoading = hasMounted && isConnecting;

    return (
      <button
        className={`btn btn-ghost btn-sm gap-2 ${className}`}
        onClick={() => {
          if (isE2EWalletEnabled()) {
            setE2EWalletState(true);
            return;
          }
          openConnectModal?.();
        }}
        disabled={showLoading}
      >
        {showLoading ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <WalletIcon className="w-5 h-5" />
        )}
        <span className="hidden sm:inline">Connect</span>
      </button>
    );
  }

  // Connected state
  return (
    <div className={`dropdown dropdown-end ${className}`} ref={dropdownRef}>
      <button
        className="btn btn-ghost btn-sm btn-circle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Wallet menu"
        aria-expanded={isOpen}
      >
        <WalletIcon className="w-5 h-5 text-success" />
      </button>

      {isOpen && (
        <div className="dropdown-content menu p-4 shadow-lg bg-base-200 rounded-box w-64 mt-2 z-50">
          <div className="flex flex-col gap-3">
            {/* Address */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-base-content/60">Address</span>
              <span className="font-mono text-sm">{truncatedAddress}</span>
            </div>

            {/* Balance */}
            {showBalance && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-base-content/60">Balance</span>
                <span className="font-mono text-sm">{formattedBalance}</span>
              </div>
            )}

            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-success">Connected</span>
            </div>

            {/* Divider */}
            <div className="divider my-0" />

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                className="btn btn-ghost btn-sm justify-start"
                onClick={() => {
                  if (address) {
                    navigator.clipboard.writeText(address);
                  }
                  setIsOpen(false);
                }}
              >
                <CopyIcon className="w-4 h-4" />
                Copy Address
              </button>
              <button
                className="btn btn-ghost btn-sm justify-start text-error"
                onClick={() => {
                  if (isE2EWalletEnabled()) {
                    setE2EWalletState(false);
                  } else {
                    disconnect();
                  }
                  setIsOpen(false);
                }}
              >
                <DisconnectIcon className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon components
function WalletIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
      />
    </svg>
  );
}

function CopyIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
      />
    </svg>
  );
}

function DisconnectIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
      />
    </svg>
  );
}

export default WalletButton;
