"use client";

import { type ReactNode, useState } from "react";

import {
  type Chain,
  RainbowKitProvider,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";
import { WagmiProvider } from "wagmi";

// Abstract Testnet chain configuration
const abstractTestnet = defineChain({
  id: 11124,
  name: "Abstract Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://api.testnet.abs.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Abstract Explorer",
      url: "https://explorer.testnet.abs.xyz",
    },
  },
  testnet: true,
});

// Base chain configuration
const base = defineChain({
  id: 8453,
  name: "Base",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet.base.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Basescan",
      url: "https://basescan.org",
    },
  },
});

const testnetChains: readonly [Chain, ...Chain[]] = [abstractTestnet];
const mainnetChains: readonly [Chain, ...Chain[]] = [base];

// Wagmi configuration
const wagmiConfig = getDefaultConfig({
  appName: "Bonfires.ai",
  projectId: process.env["NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"] ?? "bonfires-project-id",
  chains:
    process.env["NEXT_PUBLIC_ENVIRONMENT"] === "development"
      ? testnetChains
      : mainnetChains,
  ssr: false,
});

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  // Separate QueryClient for Web3 to avoid conflicts with main app QueryClient
  const [web3QueryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute for Web3 queries
            gcTime: 5 * 60 * 1000,
            retry: 2,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={web3QueryClient}>
        <RainbowKitProvider modalSize="compact" showRecentTransactions={true}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
