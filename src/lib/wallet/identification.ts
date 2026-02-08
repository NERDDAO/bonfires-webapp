/**
 * Wallet Identification Helpers
 *
 * Utilities for wallet-based user identification.
 * Integrates with Wagmi for wallet state management.
 */
"use client";

import { useMemo } from "react";

import { useBalance, useChainId } from "wagmi";

import type { WalletState } from "@/types/web3";

import { isE2EWalletEnabled, useE2EBalance, useWalletAccount } from "./e2e";

/**
 * Wallet Identification Helpers
 *
 * Utilities for wallet-based user identification.
 * Integrates with Wagmi for wallet state management.
 */

/**
 * Format wallet address for display
 * Shows first 6 and last 4 characters
 */
export function formatWalletAddress(
  address: string | null | undefined
): string {
  if (!address) return "";
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Validate that a string is a valid Ethereum address
 */
export function isValidAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if two addresses are the same (case-insensitive)
 */
export function isSameAddress(
  address1: string | null | undefined,
  address2: string | null | undefined
): boolean {
  if (!address1 || !address2) return false;
  return address1.toLowerCase() === address2.toLowerCase();
}

/**
 * Hook for getting wallet identity state
 * Provides consistent wallet state across the app
 */
export function useWalletIdentity(): WalletState & {
  formattedAddress: string;
  isValid: boolean;
} {
  const { address, isConnected, isConnecting } = useWalletAccount();
  const chainId = useChainId();
  const e2eBalance = useE2EBalance();
  const { data: balanceData } = useBalance({
    address: address as `0x${string}` | undefined,
  });

  const balance = isE2EWalletEnabled() ? e2eBalance : balanceData;
  const formattedAddress = useMemo(
    () => formatWalletAddress(address),
    [address]
  );

  const isValid = useMemo(() => isValidAddress(address), [address]);

  return {
    address: address ?? null,
    chainId: chainId ?? null,
    balance: balance?.formatted ?? null,
    isConnected,
    isConnecting,
    formattedAddress,
    isValid,
  };
}

/**
 * Hook for checking if the current user owns a resource
 */
export function useIsOwner(ownerWallet: string | null | undefined): boolean {
  const { address } = useWalletAccount();
  return useMemo(
    () => isSameAddress(address, ownerWallet),
    [address, ownerWallet]
  );
}

/**
 * Hook for getting user wallet address (null-safe)
 * Returns null if wallet is not connected
 */
export function useUserWallet(): string | null {
  const { address, isConnected } = useWalletAccount();
  return isConnected && address ? address : null;
}

/**
 * Hook for requiring wallet connection
 * Throws an error message if wallet is not connected
 */
export function useRequireWallet():
  | {
      address: string;
      isConnected: true;
    }
  | {
      address: null;
      isConnected: false;
      error: string;
    } {
  const { address, isConnected } = useWalletAccount();

  if (!isConnected || !address) {
    return {
      address: null,
      isConnected: false,
      error: "Please connect your wallet to continue",
    };
  }

  return {
    address,
    isConnected: true,
  };
}

/**
 * Check if current wallet is on the expected chain
 */
export function useIsCorrectChain(expectedChainId: number): boolean {
  const chainId = useChainId();
  return chainId === expectedChainId;
}

/**
 * Format balance for display with symbol
 */
export function formatBalance(
  balance: string | null | undefined,
  symbol = "ETH",
  decimals = 4
): string {
  if (!balance) return `0 ${symbol}`;
  const num = parseFloat(balance);
  if (isNaN(num)) return `0 ${symbol}`;
  return `${num.toFixed(decimals)} ${symbol}`;
}

/**
 * Hook for formatted balance display
 */
export function useFormattedBalance(symbol = "ETH", decimals = 4): string {
  const { address } = useWalletAccount();
  const e2eBalance = useE2EBalance();
  const { data: balanceData } = useBalance({
    address: address as `0x${string}` | undefined,
  });
  const balance = isE2EWalletEnabled() ? e2eBalance : balanceData;

  return useMemo(
    () => formatBalance(balance?.formatted, symbol, decimals),
    [balance?.formatted, symbol, decimals]
  );
}

/**
 * Determine if an address is a contract (heuristic based on code presence)
 * Note: This requires an async call to check for contract code
 */
export async function isContractAddress(
  address: string,
  getCode: (address: `0x${string}`) => Promise<string>
): Promise<boolean> {
  if (!isValidAddress(address)) return false;
  try {
    const code = await getCode(address as `0x${string}`);
    return code !== "0x" && code !== "";
  } catch {
    return false;
  }
}
