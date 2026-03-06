"use client";

/**
 * useBonfireToken
 *
 * Reads ERC-1155 balance and approval state for the provisioning flow.
 *
 * - `balance`: how many of the configured token ID the connected wallet holds
 * - `isApproved`: whether the wrapper contract is already approved (Step 4b skip)
 */
import { useAccount, useReadContract } from "wagmi";
import { mainnet } from "viem/chains";

const ERC1155_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "isApprovedForAll",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const erc1155Address = (process.env["NEXT_PUBLIC_ERC1155_CONTRACT_ADDRESS"] ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

const tokenId = BigInt(process.env["NEXT_PUBLIC_ERC1155_TOKEN_ID"] ?? "1");

const wrapperAddress = (process.env["NEXT_PUBLIC_PROVISION_WRAPPER_ADDRESS"] ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export interface UseBonfireTokenReturn {
  balance: bigint;
  isApproved: boolean;
  isLoading: boolean;
  refetch: () => void;
}

export function useBonfireToken(): UseBonfireTokenReturn {
  const { address } = useAccount();

  const {
    data: balanceData,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useReadContract({
    address: erc1155Address,
    abi: ERC1155_ABI,
    functionName: "balanceOf",
    args: address ? [address, tokenId] : undefined,
    chainId: mainnet.id,
    query: { enabled: !!address },
  });

  const {
    data: approvedData,
    isLoading: approvalLoading,
    refetch: refetchApproval,
  } = useReadContract({
    address: erc1155Address,
    abi: ERC1155_ABI,
    functionName: "isApprovedForAll",
    args: address ? [address, wrapperAddress] : undefined,
    chainId: mainnet.id,
    query: { enabled: !!address },
  });

  return {
    balance: balanceData ?? 0n,
    isApproved: approvedData ?? false,
    isLoading: balanceLoading || approvalLoading,
    refetch: () => {
      void refetchBalance();
      void refetchApproval();
    },
  };
}
