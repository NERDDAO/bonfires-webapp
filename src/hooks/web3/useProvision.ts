"use client";

/**
 * useProvision
 *
 * Orchestrates the four sequential sub-steps of the provisioning flow:
 *   1. Upload metadata to IPFS (POST /api/ipfs/upload)
 *   2. setApprovalForAll on ERC-1155 (skipped if already approved)
 *   3. Call provision(ipfs_uri) on the wrapper contract and wait for receipt
 *   4. POST /api/provision to create off-chain resources
 *
 * Exposes a single `provision(formData)` function and a reactive `state`
 * object for the wizard to render progress.
 */
import { useCallback, useState } from "react";

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { mainnet } from "viem/chains";

import type { ProcessingState, ProvisionFormData, ProvisionResult } from "@/types";

import { useBonfireToken } from "./useBonfireToken";

const WRAPPER_ABI = [
  {
    name: "provision",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenURI", type: "string" }],
    outputs: [{ name: "erc8004BonfireId", type: "uint256" }],
  },
] as const;

const ERC1155_APPROVAL_ABI = [
  {
    name: "setApprovalForAll",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
] as const;

const erc1155Address = (process.env["NEXT_PUBLIC_ERC1155_CONTRACT_ADDRESS"] ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

const wrapperAddress = (process.env["NEXT_PUBLIC_PROVISION_WRAPPER_ADDRESS"] ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export interface UseProvisionReturn {
  state: ProcessingState;
  provision: (formData: ProvisionFormData) => Promise<ProvisionResult>;
  reset: () => void;
}

export function useProvision(): UseProvisionReturn {
  const { address } = useAccount();
  const { isApproved } = useBonfireToken();

  const [state, setState] = useState<ProcessingState>({ step: "ipfs" });

  const { writeContractAsync: writeApproval } = useWriteContract();
  const { writeContractAsync: writeProvision } = useWriteContract();

  // We use a ref-like pattern for tx hash to feed into the receipt watcher
  const [provisionTxHash, setProvisionTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { data: receipt, isLoading: isWaitingForReceipt } = useWaitForTransactionReceipt({
    hash: provisionTxHash,
    chainId: mainnet.id,
    query: { enabled: !!provisionTxHash },
  });

  // Suppress unused warning — receipt is consumed imperatively in the provision fn
  void receipt;
  void isWaitingForReceipt;

  const reset = useCallback(() => {
    setState({ step: "ipfs" });
    setProvisionTxHash(undefined);
  }, []);

  const provision = useCallback(
    async (formData: ProvisionFormData): Promise<ProvisionResult> => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      // ── Sub-step 1: IPFS upload ────────────────────────────────────────
      setState({ step: "ipfs" });

      const ipfsResponse = await fetch("/api/ipfs/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.agentName,
          description: formData.description,
          capabilities: formData.capabilities,
        }),
      });

      if (!ipfsResponse.ok) {
        const errorData = await ipfsResponse.json().catch(() => ({})) as Record<string, unknown>;
        const errorMsg =
          typeof errorData["error"] === "string"
            ? errorData["error"]
            : "Failed to upload metadata to IPFS";
        setState({ step: "error", error: errorMsg });
        throw new Error(errorMsg);
      }

      const { ipfs_uri: ipfsUri } = (await ipfsResponse.json()) as { ipfs_uri: string };

      // ── Sub-step 2: ERC-1155 approval (skip if already approved) ──────
      setState({ step: "approval" });

      if (!isApproved) {
        try {
          const approvalTx = await writeApproval({
            address: erc1155Address,
            abi: ERC1155_APPROVAL_ABI,
            functionName: "setApprovalForAll",
            args: [wrapperAddress, true],
            chainId: mainnet.id,
          });

          // Wait for approval receipt
          await waitForHash(approvalTx);
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Wallet approval rejected";
          setState({ step: "error", error: msg });
          throw err;
        }
      }

      // ── Sub-step 3: provision(ipfs_uri) + wait for receipt ────────────
      setState({ step: "tx" });

      let txHash: `0x${string}`;
      try {
        txHash = await writeProvision({
          address: wrapperAddress,
          abi: WRAPPER_ABI,
          functionName: "provision",
          args: [ipfsUri],
          chainId: mainnet.id,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Wallet transaction rejected";
        setState({ step: "error", error: msg });
        throw err;
      }

      setState({ step: "tx", txHash });
      setProvisionTxHash(txHash);

      // Poll for transaction receipt (up to 5 min)
      const txReceipt = await waitForHash(txHash);

      if (txReceipt.status === "reverted") {
        const msg = "Transaction reverted on-chain";
        setState({ step: "error", error: msg, txHash });
        throw new Error(msg);
      }

      // ── Sub-step 4: POST /api/provision ───────────────────────────────
      setState({ step: "backend", txHash });

      const provisionResponse = await fetch("/api/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_hash: txHash,
          wallet_address: address,
          agent_name: formData.agentName,
          description: formData.description,
          capabilities: formData.capabilities,
        }),
      });

      if (!provisionResponse.ok) {
        const errorData = await provisionResponse.json().catch(() => ({})) as Record<string, unknown>;
        const errorMsg =
          typeof errorData["error"] === "string"
            ? errorData["error"]
            : "Failed to create Bonfire resources";
        setState({ step: "error", error: errorMsg, txHash });
        throw new Error(errorMsg);
      }

      const result = (await provisionResponse.json()) as {
        bonfire_id: string;
        agent_id: string;
        erc8004_bonfire_id: number;
        api_key_last4: string;
        ipfs_uri: string;
      };

      setState({ step: "done", txHash });

      return {
        bonfireId: result.bonfire_id,
        agentId: result.agent_id,
        erc8004BonfireId: result.erc8004_bonfire_id,
        apiKeyLast4: result.api_key_last4,
        ipfsUri: result.ipfs_uri,
      };
    },
    [address, isApproved, writeApproval, writeProvision]
  );

  return { state, provision, reset };
}

/**
 * Poll Ethereum for a transaction receipt.
 * Uses the wagmi/viem publicClient indirectly via native fetch to the RPC.
 * We rely on a simple polling loop rather than exposing a hook for this,
 * because `useWaitForTransactionReceipt` only works reactively (hook-level),
 * not imperatively inside an async function.
 */
async function waitForHash(
  txHash: `0x${string}`,
  timeoutMs = 300_000,
  intervalMs = 3_000
): Promise<{ status: "success" | "reverted" }> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      // Use the Ethereum mainnet public RPC via wagmi's default config
      const rpcUrl = "https://cloudflare-eth.com";
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getTransactionReceipt",
          params: [txHash],
        }),
      });

      const data = (await response.json()) as {
        result: { status: string } | null;
      };

      if (data.result) {
        const status = data.result.status === "0x1" ? "success" : "reverted";
        return { status };
      }
    } catch {
      // Network error — keep polling
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Transaction receipt not found within timeout");
}
