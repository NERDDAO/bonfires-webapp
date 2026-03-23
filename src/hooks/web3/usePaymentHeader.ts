"use client";

/**
 * usePaymentHeader Hook
 *
 * Hook for building and signing X402 payment headers.
 * Handles both new payments and existing microsub modes.
 */
import { useCallback, useState } from "react";

import type { SignTypedDataParameters } from "viem";
import { useSignTypedData } from "wagmi";

import {
  buildPaymentTypedData,
  encodePaymentHeader,
  fetchPaymentConfig,
} from "@/lib/payment";
import type { X402PaymentHeader } from "@/lib/payment";
import { isE2EWalletEnabled, useWalletAccount } from "@/lib/wallet/e2e";

export interface UsePaymentHeaderReturn {
  /**
   * Build and sign a payment header for X402 protocol.
   *
   * @param amount - Optional payment amount in token units. Defaults to config amount.
   * @param skipSigning - When true, skips wallet signing and returns null.
   *                      Used when an existing microsub is selected.
   * @returns X402PaymentHeader string or null if skipSigning is true.
   */
  buildAndSignPaymentHeader: (
    amount?: string,
    skipSigning?: boolean
  ) => Promise<X402PaymentHeader | null>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

// Static fallback config from environment (used if server fetch fails)
const PAYMENT_NETWORK = process.env["NEXT_PUBLIC_PAYMENT_NETWORK"] ?? "base";

const FALLBACK_CONFIG = {
  tokenAddress:
    process.env["NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS"] ??
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  recipientAddress:
    process.env["NEXT_PUBLIC_ONCHAINFI_INTERMEDIARY_ADDRESS"] ?? "",
  network: PAYMENT_NETWORK,
  chainId: parseInt(process.env["NEXT_PUBLIC_CHAIN_ID"] ?? "8453", 10),
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

        // Fetch payment config from server (cached after first call)
        let recipientAddress = FALLBACK_CONFIG.recipientAddress;
        let tokenAddress = FALLBACK_CONFIG.tokenAddress;
        let network = FALLBACK_CONFIG.network;
        try {
          const serverConfig = await fetchPaymentConfig();
          recipientAddress = serverConfig.payTo;
          tokenAddress = serverConfig.asset || tokenAddress;
          network = serverConfig.network || network;
        } catch (fetchErr) {
          console.warn(
            "Failed to fetch payment config from server, using fallback:",
            fetchErr
          );
        }

        const paymentAmount = amount || FALLBACK_CONFIG.amount;
        if (isE2EWalletEnabled()) {
          const typedData = buildPaymentTypedData({
            tokenAddress,
            recipientAddress,
            amount: paymentAmount,
            network,
            chainId: FALLBACK_CONFIG.chainId,
            userAddress: address,
          });
          return encodePaymentHeader(
            typedData.message,
            "0xe2e-signature",
            network
          );
        }

        const typedData = buildPaymentTypedData({
          tokenAddress,
          recipientAddress,
          amount: paymentAmount,
          network,
          chainId: FALLBACK_CONFIG.chainId,
          userAddress: address,
        });

        const signature = await signTypedDataAsync({
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        } as unknown as SignTypedDataParameters);

        return encodePaymentHeader(typedData.message, signature, network);
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
