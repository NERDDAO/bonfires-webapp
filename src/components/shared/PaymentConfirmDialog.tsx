"use client";

import { useState } from "react";

import { useBalance } from "wagmi";

import {
  isE2EWalletEnabled,
  useE2EBalance,
  useWalletAccount,
} from "@/lib/wallet/e2e";

import { Modal } from "../common/Modal";

interface PaymentConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Callback when payment is confirmed */
  onConfirm: () => Promise<void>;
  /** Description of the action being paid for */
  action: string;
  /** Cost in USD */
  cost: number;
  /** Additional details to show (optional) */
  details?: {
    label: string;
    value: string;
  }[];
}

/**
 * PaymentConfirmDialog Component
 *
 * A consistent payment confirmation dialog used across all paid features.
 * Shows cost, wallet balance, and action description.
 *
 * Features:
 * - Displays action description
 * - Shows cost in USD
 * - Shows wallet balance
 * - Loading state during transaction
 * - Error handling
 */
export function PaymentConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  action,
  cost,
  details = [],
}: PaymentConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useWalletAccount();
  const e2eBalance = useE2EBalance();
  const { data: balanceData } = useBalance({
    address: address as `0x${string}` | undefined,
  });
  const balance = isE2EWalletEnabled() ? e2eBalance : balanceData;

  // Format balance for display
  const formattedBalance = balance
    ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
    : "0.0000 ETH";

  // Handle confirm action
  async function handleConfirm() {
    setIsLoading(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Transaction failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Handle close (reset error state)
  function handleClose() {
    setError(null);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Confirm Payment"
      size="sm"
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      footer={
        <>
          <button
            className="btn btn-ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={isLoading || !isConnected}
          >
            {isLoading && (
              <span className="loading loading-spinner loading-sm" />
            )}
            {isLoading ? "Processing..." : "Confirm Payment"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Action description */}
        <div className="bg-base-200 rounded-lg p-4">
          <p className="text-sm text-base-content/60">Action</p>
          <p className="font-medium">{action}</p>
        </div>

        {/* Cost */}
        <div className="flex items-center justify-between py-2 border-b border-base-300">
          <span className="text-base-content/60">Cost</span>
          <span className="font-mono font-bold text-lg">
            ${cost.toFixed(2)} USD
          </span>
        </div>

        {/* Additional details */}
        {details.map((detail, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-base-300"
          >
            <span className="text-base-content/60">{detail.label}</span>
            <span className="font-medium">{detail.value}</span>
          </div>
        ))}

        {/* Wallet balance */}
        <div className="flex items-center justify-between py-2">
          <span className="text-base-content/60">Your Balance</span>
          <span className="font-mono">{formattedBalance}</span>
        </div>

        {/* Wallet connection warning */}
        {!isConnected && (
          <div className="alert alert-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Please connect your wallet to proceed.</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Transaction info */}
        <p className="text-xs text-base-content/50 text-center">
          You will be prompted to approve this transaction in your wallet.
        </p>
      </div>
    </Modal>
  );
}

export default PaymentConfirmDialog;
