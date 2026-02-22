"use client";

/**
 * MyBonfiresSection
 *
 * Dashboard section listing all provisioned Bonfires for the connected wallet.
 * Includes a wallet-signature API key reveal flow:
 *   1. GET /api/provision/reveal_nonce?tx_hash=...
 *   2. wallet.signMessage(message)
 *   3. POST /api/provision/reveal_api_key { tx_hash, nonce, signature }
 *   4. Display raw key in-place with copy button
 *
 * The revealed API key is held only in component state and never written to
 * localStorage or forwarded to any analytics/logging service.
 */

import { useCallback, useState } from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { useAccount, useReadContract, useSignMessage } from "wagmi";
import { mainnet } from "viem/chains";

import type { ProvisionedBonfireRecord } from "@/types";

import { DashboardSection } from "./DashboardSection";

const ERC8004_REGISTRY = (process.env["NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS"] ??
  "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432") as `0x${string}`;

const OWNER_OF_ABI = [
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface RevealState {
  status: "idle" | "fetching_nonce" | "signing" | "fetching_key" | "done" | "error";
  apiKey?: string;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchProvisionedBonfires(
  walletAddress: string
): Promise<ProvisionedBonfireRecord[]> {
  const params = new URLSearchParams({ wallet_address: walletAddress });
  const res = await fetch(`/api/provision?${params.toString()}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to fetch provisioned bonfires");
  }
  const data = (await res.json()) as
    | { records: ProvisionedBonfireRecord[] }
    | ProvisionedBonfireRecord[];
  return Array.isArray(data) ? data : (data.records ?? []);
}

async function fetchRevealNonce(
  txHash: string
): Promise<{ nonce: string; message: string }> {
  const params = new URLSearchParams({ tx_hash: txHash });
  const res = await fetch(`/api/provision/reveal_nonce?${params.toString()}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to get reveal nonce");
  }
  return res.json() as Promise<{ nonce: string; message: string }>;
}

async function fetchRevealApiKey(
  txHash: string,
  nonce: string,
  signature: string
): Promise<string> {
  const res = await fetch("/api/provision/reveal_api_key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tx_hash: txHash, nonce, signature }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.status === 403) {
      throw new Error("Wrong wallet — the connected wallet does not own this Bonfire NFT.");
    }
    throw new Error(body.error ?? "Failed to reveal API key");
  }
  const data = (await res.json()) as { api_key: string };
  return data.api_key;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="btn btn-xs btn-ghost font-mono"
      title={`Copy ${label}`}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function InfoRow({
  label,
  value,
  copyable,
  link,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  link?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="text-base-content/60 shrink-0 w-28">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-primary truncate hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="font-mono truncate">{value}</span>
        )}
        {copyable && <CopyButton value={value} label={label} />}
      </div>
    </div>
  );
}

function ApiKeyRow({
  record,
  revealState,
  onReveal,
  disabled,
}: {
  record: ProvisionedBonfireRecord;
  revealState: RevealState;
  onReveal: (txHash: string) => void;
  disabled?: boolean;
}) {
  const isRevealing =
    revealState.status === "fetching_nonce" ||
    revealState.status === "signing" ||
    revealState.status === "fetching_key";

  const statusLabel: Record<string, string> = {
    fetching_nonce: "Preparing…",
    signing: "Sign in wallet…",
    fetching_key: "Retrieving…",
  };

  if (revealState.status === "done" && revealState.apiKey) {
    return (
      <div className="flex items-start justify-between gap-2 text-sm">
        <span className="text-base-content/60 shrink-0 w-28">API Key</span>
        <div className="flex items-center gap-1 min-w-0">
          <span className="font-mono text-success truncate">{revealState.apiKey}</span>
          <CopyButton value={revealState.apiKey} label="API Key" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="text-base-content/60 shrink-0 w-28">API Key</span>
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <span className="font-mono text-base-content/70">
          {record.api_key_last4 ? `••••••••${record.api_key_last4}` : "••••••••••••"}
        </span>
        {revealState.status === "error" && revealState.error && (
          <span className="text-error text-xs">{revealState.error}</span>
        )}
        <button
          onClick={() => onReveal(record.tx_hash)}
          disabled={isRevealing || disabled}
          className="btn btn-xs btn-outline"
          title={disabled ? "Only the NFT holder can reveal this key" : undefined}
        >
          {isRevealing
            ? (statusLabel[revealState.status] ?? "…")
            : revealState.status === "error"
            ? "Retry"
            : "Reveal"}
        </button>
      </div>
    </div>
  );
}

function BonfireCard({
  record,
  revealState,
  onReveal,
  connectedAddress,
}: {
  record: ProvisionedBonfireRecord;
  revealState: RevealState;
  onReveal: (txHash: string) => void;
  connectedAddress: string | undefined;
}) {
  const { data: nftOwner } = useReadContract({
    address: ERC8004_REGISTRY,
    abi: OWNER_OF_ABI,
    functionName: "ownerOf",
    args: [BigInt(record.erc8004_bonfire_id)],
    chainId: mainnet.id,
    query: { enabled: record.status === "complete", staleTime: 60_000 },
  });

  const isCurrentOwner =
    !!connectedAddress &&
    !!nftOwner &&
    connectedAddress.toLowerCase() === nftOwner.toLowerCase();

  const statusBadge: Record<string, string> = {
    complete: "badge-success",
    pending: "badge-warning",
    failed: "badge-error",
  };

  return (
    <div className="p-4 bg-base-300 rounded-lg space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{record.agent_name}</p>
          {record.description && (
            <p className="text-sm text-base-content/60 line-clamp-2">
              {record.description}
            </p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {record.status === "complete" && nftOwner && (
            <span className={`badge badge-sm ${isCurrentOwner ? "badge-primary" : "badge-warning"}`}>
              {isCurrentOwner ? "NFT Owner" : "Transferred"}
            </span>
          )}
          <span
            className={`badge badge-sm ${statusBadge[record.status] ?? "badge-ghost"}`}
          >
            {record.status}
          </span>
        </div>
      </div>

      {/* Transferred notice */}
      {record.status === "complete" && nftOwner && !isCurrentOwner && (
        <div className="alert alert-warning py-2 text-xs">
          <span>
            This Bonfire&apos;s NFT has been transferred. Only the current NFT
            holder ({nftOwner.slice(0, 6)}...{nftOwner.slice(-4)}) can reveal
            the API key.
          </span>
        </div>
      )}

      {/* Capabilities */}
      {record.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {record.capabilities.map((cap) => (
            <span key={cap} className="badge badge-xs badge-outline">
              {cap}
            </span>
          ))}
        </div>
      )}

      {/* Fields */}
      <div className="space-y-2 border-t border-base-content/10 pt-2">
        <InfoRow
          label="ERC-8004 ID"
          value={String(record.erc8004_bonfire_id)}
          link={`https://8004scan.io/bonfire/${record.erc8004_bonfire_id}`}
        />
        {record.bonfire_id && (
          <InfoRow label="Bonfire ID" value={record.bonfire_id} copyable />
        )}
        {record.agent_id && (
          <InfoRow label="Agent ID" value={record.agent_id} copyable />
        )}
        {record.status === "complete" && (
          <ApiKeyRow
            record={record}
            revealState={revealState}
            onReveal={isCurrentOwner ? onReveal : () => {}}
            disabled={!isCurrentOwner}
          />
        )}
        {record.status === "failed" && record.error_message && (
          <div className="text-xs text-error mt-1">{record.error_message}</div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MyBonfiresSection() {
  const { address, isConnected } = useAccount();

  const { signMessageAsync } = useSignMessage();

  // Per-bonfire reveal state keyed by tx_hash
  const [revealStates, setRevealStates] = useState<Record<string, RevealState>>({});

  const setRevealState = useCallback((txHash: string, state: RevealState) => {
    setRevealStates((prev) => ({ ...prev, [txHash]: state }));
  }, []);

  const {
    data: records,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["provisioned-bonfires", address],
    queryFn: () => fetchProvisionedBonfires(address!),
    enabled: isConnected && !!address,
    staleTime: 30_000,
  });

  const handleReveal = useCallback(
    async (txHash: string) => {
      setRevealState(txHash, { status: "fetching_nonce" });

      try {
        const { nonce, message } = await fetchRevealNonce(txHash);

        setRevealState(txHash, { status: "signing" });

        let signature: string;
        try {
          signature = await signMessageAsync({ message });
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Wallet signature rejected";
          setRevealState(txHash, { status: "error", error: msg });
          return;
        }

        setRevealState(txHash, { status: "fetching_key" });

        const apiKey = await fetchRevealApiKey(txHash, nonce, signature);
        setRevealState(txHash, { status: "done", apiKey });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to reveal API key";
        setRevealState(txHash, { status: "error", error: msg });
      }
    },
    [signMessageAsync, setRevealState]
  );

  if (!isConnected) {
    return (
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-lg">
            <span className="mr-2">🔥</span>
            My Bonfires
          </h2>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-base-content/70 text-sm">
              Connect your wallet to see your provisioned Bonfires.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !isLoading && !isError && (!records || records.length === 0);

  return (
    <DashboardSection
      title="My Bonfires"
      icon="🔥"
      isLoading={isLoading}
      isError={isError}
      errorMessage={
        error instanceof Error ? error.message : "Failed to load your Bonfires"
      }
      onRetry={refetch}
      isEmpty={isEmpty}
      emptyMessage="No provisioned Bonfires yet."
      headerAction={
        <Link
          href="/erc1155-register"
          className="btn btn-primary btn-sm"
        >
          Provision Bonfire
        </Link>
      }
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-4 text-center gap-3">
          <p className="text-base-content/70 text-sm">
            No provisioned Bonfires yet.
          </p>
          <Link href="/erc1155-register" className="btn btn-primary btn-sm">
            Provision your first Bonfire →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {(records ?? []).map((record) => (
            <BonfireCard
              key={record.tx_hash}
              record={record}
              revealState={revealStates[record.tx_hash] ?? { status: "idle" }}
              onReveal={handleReveal}
              connectedAddress={address}
            />
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
