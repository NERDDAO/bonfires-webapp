"use client";

import { useReadContract } from "wagmi";
import { mainnet } from "viem/chains";

const BONFIRES_NFT_ADDRESS = "0x3e2d331c1db4c50694d9dd6412b5930e87eca1cf" as const;

const MINT_ABI = [
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "mintPrice",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "maxSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export interface UseBonfiresMintReturn {
  totalMinted: number;
  maxSupply: number;
  priceEth: string;
  isLoading: boolean;
}

export function useBonfiresMint(): UseBonfiresMintReturn {
  const { data: totalSupply, isLoading: tsLoading } = useReadContract({
    address: BONFIRES_NFT_ADDRESS,
    abi: MINT_ABI,
    functionName: "totalSupply",
    chainId: mainnet.id,
  });

  const { data: mintPrice, isLoading: mpLoading } = useReadContract({
    address: BONFIRES_NFT_ADDRESS,
    abi: MINT_ABI,
    functionName: "mintPrice",
    chainId: mainnet.id,
  });

  const { data: maxSupplyData, isLoading: msLoading } = useReadContract({
    address: BONFIRES_NFT_ADDRESS,
    abi: MINT_ABI,
    functionName: "maxSupply",
    chainId: mainnet.id,
  });

  const priceWei = mintPrice ?? 0n;
  const priceEth = (Number(priceWei) / 1e18).toString();

  return {
    totalMinted: Number(totalSupply ?? 0n),
    maxSupply: Number(maxSupplyData ?? 0n),
    priceEth,
    isLoading: tsLoading || mpLoading || msLoading,
  };
}
