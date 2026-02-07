"use client";

import { type ReactNode, useState } from "react";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
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

// Wagmi configuration
const wagmiConfig = getDefaultConfig({
  appName: "Delve",
  projectId: process.env["NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"] ?? "demo",
  chains: [abstractTestnet],
  ssr: true,
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
