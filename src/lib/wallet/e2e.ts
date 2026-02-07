"use client";

import { useEffect, useMemo, useState } from "react";

import { useAccount } from "wagmi";

export interface WalletAccountState {
  address?: string;
  isConnected: boolean;
  isConnecting: boolean;
}

const E2E_WALLET_STORAGE_KEY = "e2e.wallet.connected";
const E2E_WALLET_ADDRESS_KEY = "e2e.wallet.address";
const E2E_WALLET_BALANCE_KEY = "e2e.wallet.balance";
const DEFAULT_E2E_ADDRESS = "0xE2E0000000000000000000000000000000000000";
const DEFAULT_E2E_BALANCE = "1.2345";

export function isE2EWalletEnabled(): boolean {
  return process.env["NEXT_PUBLIC_E2E_WALLET"] === "true";
}

export function setE2EWalletState(
  isConnected: boolean,
  address?: string
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(E2E_WALLET_STORAGE_KEY, String(isConnected));
  if (address) {
    window.localStorage.setItem(E2E_WALLET_ADDRESS_KEY, address);
  } else if (!isConnected) {
    window.localStorage.removeItem(E2E_WALLET_ADDRESS_KEY);
  }
  window.dispatchEvent(new CustomEvent("e2e-wallet-update"));
}

export function setE2EWalletBalance(balance: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(E2E_WALLET_BALANCE_KEY, balance);
  window.dispatchEvent(new CustomEvent("e2e-wallet-update"));
}

function readE2EWalletState(): WalletAccountState {
  if (typeof window === "undefined") {
    return { address: undefined, isConnected: false, isConnecting: false };
  }
  const isConnected =
    window.localStorage.getItem(E2E_WALLET_STORAGE_KEY) === "true";
  const address =
    window.localStorage.getItem(E2E_WALLET_ADDRESS_KEY) ?? DEFAULT_E2E_ADDRESS;
  return {
    address: isConnected ? address : undefined,
    isConnected,
    isConnecting: false,
  };
}

export function useWalletAccount(): WalletAccountState {
  const account = useAccount();
  const [e2eState, setE2eState] = useState<WalletAccountState>(() =>
    readE2EWalletState()
  );

  useEffect(() => {
    if (!isE2EWalletEnabled()) return;

    const handleUpdate = () => {
      setE2eState(readE2EWalletState());
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("e2e-wallet-update", handleUpdate);
    handleUpdate();

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("e2e-wallet-update", handleUpdate);
    };
  }, []);

  if (!isE2EWalletEnabled()) {
    return {
      address: account.address,
      isConnected: account.isConnected,
      isConnecting: account.isConnecting,
    };
  }

  return e2eState;
}

export function useE2EBalance(): { formatted: string; symbol: string } {
  const [balance, setBalance] = useState<string>(DEFAULT_E2E_BALANCE);

  useEffect(() => {
    if (!isE2EWalletEnabled()) return;

    const handleUpdate = () => {
      const stored = window.localStorage.getItem(E2E_WALLET_BALANCE_KEY);
      setBalance(stored ?? DEFAULT_E2E_BALANCE);
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("e2e-wallet-update", handleUpdate);
    handleUpdate();

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("e2e-wallet-update", handleUpdate);
    };
  }, []);

  return useMemo(() => ({ formatted: balance, symbol: "ETH" }), [balance]);
}
