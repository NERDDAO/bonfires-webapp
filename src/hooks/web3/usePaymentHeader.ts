"use client";

/**
 * usePaymentHeader Hook
 *
 * Hook for building and signing X402 payment headers.
 * Handles both new payments and existing microsub modes.
 */

import { useCallback, useState } from "react";
import { useSignTypedData } from "wagmi";
import { config } from "@/lib/config";
import { buildPaymentTypedData, encodePaymentHeader } from "@/lib/payment";
import type { X402PaymentHeader } from "@/lib/payment";
import { isE2EWalletEnabled, useWalletAccount } from "@/lib/wallet/e2e";

export interface UsePaymentHeaderReturn {
  /**
   * Build and sign a payment header for X402 protocol.
   *
   * @param amount - Optional payment amount in token units. Defaults to config amount.
   * @param skipSigning - When true, skips wallet signing and returns null.
   *                      Used when an existing microsub is selected.
   * @returns X402PaymentHeader object or null if skipSigning is true.
   */
  buildAndSignPaymentHeader: (
    amount?: string,
    skipSigning?: boolean
  ) => Promise<X402PaymentHeader | null>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

// Payment configuration from environment
const PAYMENT_CONFIG = {
  tokenAddress:
    process.env["NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS"] ??
    "0x0000000000000000000000000000000000000000",
  intermediaryAddress:
    process.env["NEXT_PUBLIC_ONCHAINFI_INTERMEDIARY_ADDRESS"] ??
    "0x0000000000000000000000000000000000000000",
  network: process.env["NEXT_PUBLIC_PAYMENT_NETWORK"] ?? "abstract-testnet",
  chainId: parseInt(process.env["NEXT_PUBLIC_CHAIN_ID"] ?? "11124", 10),
  amount: process.env["NEXT_PUBLIC_PAYMENT_DEFAULT_AMOUNT"] ?? "0.01",
};

/**
 * Hook for building and signing X402 payment headers.
 */
export function usePaymentHeader(): UsePaymentHeaderReturn {
  const { address, isConnected } = useWalletAccount();
  const { signTypedDataAsync, isPending } = useSignTypedData();
  const [error, setError] = useState<Error | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const buildAndSignPaymentHeader = useCallback(
    async (
      amount?: string,
      skipSigning?: boolean
    ): Promise<X402PaymentHeader | null> => {
      try {
        setError(null);
        setIsProcessing(true);

        // Early return if using existing microsub
        if (skipSigning === true) {
          return null;
        }

        if (!isConnected || !address) {
          throw new Error(
            "Wallet not connected. Please connect your wallet to continue."
          );
        }

        const paymentAmount = amount || PAYMENT_CONFIG.amount;
        if (isE2EWalletEnabled()) {
          const typedData = buildPaymentTypedData({
            tokenAddress: PAYMENT_CONFIG.tokenAddress,
            recipientAddress: PAYMENT_CONFIG.intermediaryAddress,
            amount: paymentAmount,
            network: PAYMENT_CONFIG.network,
            chainId: PAYMENT_CONFIG.chainId,
            userAddress: address,
          });
          return encodePaymentHeader(
            typedData.message,
            "0xe2e-signature",
            PAYMENT_CONFIG.network
          );
        }

        const typedData = buildPaymentTypedData({
          tokenAddress: PAYMENT_CONFIG.tokenAddress,
          recipientAddress: PAYMENT_CONFIG.intermediaryAddress,
          amount: paymentAmount,
          network: PAYMENT_CONFIG.network,
          chainId: PAYMENT_CONFIG.chainId,
          userAddress: address,
        });

        const signature = await signTypedDataAsync({
          domain: typedData.domain as {
            name?: string;
            version?: string;
            chainId?: number;
            verifyingContract?: `0x${string}`;
          },
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message as unknown as Record<string, unknown>,
        });

        return encodePaymentHeader(
          typedData.message,
          signature,
          PAYMENT_CONFIG.network
        );
      } catch (err) {
        const error = new Error(
          err instanceof Error ? err.message : "Failed to build payment header"
        );
        setError(error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [address, isConnected, signTypedDataAsync]
  );

  const reset = useCallback(() => setError(null), []);

  return {
    buildAndSignPaymentHeader,
    isLoading: isPending || isProcessing,
    error,
    reset,
  };
}
