"use client";

/**
 * Public Bonfire Page
 *
 * Displays bonfire info, pricing, and allows buyers to purchase
 * agent slots via x402 payment.
 */

import { useCallback, useState } from "react";

import { useParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";

import {
  useBonfireAgents,
  useBonfirePricing,
  usePurchaseAgent,
} from "@/hooks/useAgentDeploy";
import type { PurchaseAgentPayload, PurchaseAgentResult } from "@/hooks/useAgentDeploy";
import { usePaymentHeader } from "@/hooks/web3/usePaymentHeader";

type Platform = "web" | "telegram" | "discord";

interface BonfireDetail {
  id: string;
  name: string;
  purpose?: string;
  is_public?: boolean;
}

async function fetchBonfireDetail(id: string): Promise<BonfireDetail> {
  const res = await fetch(`/api/bonfires/${id}`);
  if (!res.ok) throw new Error("Failed to load bonfire");
  const data = await res.json();
  return (data as BonfireDetail);
}

function PurchaseForm({
  bonfireId,
  pricePerEpisode,
  maxEpisodes,
}: {
  bonfireId: string;
  pricePerEpisode: string;
  maxEpisodes: number;
}) {
  const { isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [platform, setPlatform] = useState<Platform>("web");
  const [agentName, setAgentName] = useState("");
  const [agentContext, setAgentContext] = useState("");
  const [episodes, setEpisodes] = useState(10);
  const [botToken, setBotToken] = useState("");

  const [purchaseResult, setPurchaseResult] = useState<PurchaseAgentResult | null>(null);
  const [revealState, setRevealState] = useState<{
    status: "idle" | "nonce" | "signing" | "revealing" | "done" | "error";
    apiKey?: string;
    error?: string;
  }>({ status: "idle" });

  const { buildAndSignPaymentHeader, isLoading: isSigningPayment } = usePaymentHeader();
  const purchaseAgent = usePurchaseAgent();

  const totalPrice = (parseFloat(pricePerEpisode) * episodes).toFixed(4);

  const handlePurchase = async () => {
    if (!agentName.trim() || !agentContext.trim()) return;
    if ((platform === "telegram" || platform === "discord") && !botToken.trim()) return;

    const paymentHeader = await buildAndSignPaymentHeader(totalPrice);
    if (!paymentHeader) return;

    const payload: PurchaseAgentPayload = {
      payment_header: paymentHeader,
      platform,
      episodes_requested: episodes,
      agent_name: agentName,
      agent_context: agentContext,
    };
    if (platform === "telegram") payload.telegram_bot_token = botToken;
    if (platform === "discord") payload.discord_bot_token = botToken;

    purchaseAgent.mutate(
      { bonfireId, data: payload },
      {
        onSuccess: (result) => setPurchaseResult(result),
      }
    );
  };

  const handleRevealApiKey = useCallback(async () => {
    if (!purchaseResult) return;
    setRevealState({ status: "nonce" });

    try {
      const nonceRes = await fetch(
        `/api/purchased-agents/${purchaseResult.purchase_id}/reveal_nonce`
      );
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const { nonce, message } = (await nonceRes.json()) as {
        nonce: string;
        message: string;
      };

      setRevealState({ status: "signing" });
      let signature: string;
      try {
        signature = await signMessageAsync({ message });
      } catch {
        setRevealState({ status: "error", error: "Wallet signature rejected" });
        return;
      }

      setRevealState({ status: "revealing" });
      const revealRes = await fetch(
        `/api/purchased-agents/${purchaseResult.purchase_id}/reveal_api_key`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nonce, signature }),
        }
      );
      if (!revealRes.ok) throw new Error("Failed to reveal API key");
      const { api_key } = (await revealRes.json()) as { api_key: string };
      setRevealState({ status: "done", apiKey: api_key });
    } catch (err) {
      setRevealState({
        status: "error",
        error: err instanceof Error ? err.message : "Reveal failed",
      });
    }
  }, [purchaseResult, signMessageAsync]);

  if (purchaseResult) {
    return (
      <div className="space-y-4">
        <div className="alert alert-success">
          <span>Agent purchased successfully!</span>
        </div>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Agent ID:</span>{" "}
            <code className="text-xs">{purchaseResult.agent_id}</code>
          </p>
          <p>
            <span className="font-medium">Username:</span> {purchaseResult.username}
          </p>
          <p>
            <span className="font-medium">Platform:</span> {purchaseResult.platform}
          </p>
          <p>
            <span className="font-medium">Episodes:</span>{" "}
            {purchaseResult.episodes_purchased}
          </p>
          <p>
            <span className="font-medium">API Key:</span> ****
            {purchaseResult.api_key_last4}
          </p>
        </div>

        {purchaseResult.platform === "web" && (
          <div className="space-y-2">
            {revealState.status === "done" && revealState.apiKey ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">Your API Key:</p>
                <div className="flex gap-2 items-center">
                  <code className="text-xs bg-base-300 px-2 py-1 rounded break-all flex-1">
                    {revealState.apiKey}
                  </code>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() =>
                      navigator.clipboard.writeText(revealState.apiKey!)
                    }
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-warning">
                  Save this key now. It won&apos;t be shown again.
                </p>
              </div>
            ) : (
              <button
                className="btn btn-primary btn-sm w-full"
                onClick={handleRevealApiKey}
                disabled={
                  revealState.status !== "idle" && revealState.status !== "error"
                }
              >
                {revealState.status === "nonce"
                  ? "Getting nonce..."
                  : revealState.status === "signing"
                    ? "Sign with wallet..."
                    : revealState.status === "revealing"
                      ? "Revealing..."
                      : "Reveal API Key"}
              </button>
            )}
            {revealState.status === "error" && (
              <p className="text-xs text-error">{revealState.error}</p>
            )}
          </div>
        )}

        {(purchaseResult.platform === "telegram" ||
          purchaseResult.platform === "discord") && (
          <div className="alert alert-info text-sm">
            Your bot will be online within 2 minutes.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Platform selector */}
      <div>
        <label className="label">
          <span className="label-text font-medium">Deployment Platform</span>
        </label>
        <div className="flex gap-2">
          {(["web", "telegram", "discord"] as Platform[]).map((p) => (
            <button
              key={p}
              className={`btn btn-sm flex-1 ${platform === p ? "btn-primary" : "btn-outline"}`}
              onClick={() => setPlatform(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Agent name */}
      <div>
        <label className="label">
          <span className="label-text">Agent Name</span>
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="My Agent"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
        />
      </div>

      {/* Agent context */}
      <div>
        <label className="label">
          <span className="label-text">System Prompt</span>
        </label>
        <textarea
          className="textarea textarea-bordered w-full"
          rows={3}
          placeholder="You are a helpful assistant..."
          value={agentContext}
          onChange={(e) => setAgentContext(e.target.value)}
        />
      </div>

      {/* Bot token (conditional) */}
      {(platform === "telegram" || platform === "discord") && (
        <div>
          <label className="label">
            <span className="label-text">
              {platform === "telegram" ? "Telegram" : "Discord"} Bot Token
            </span>
          </label>
          <input
            type="password"
            className="input input-bordered w-full"
            placeholder={`Enter your ${platform} bot token`}
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
          />
        </div>
      )}

      {/* Episode slider */}
      <div>
        <label className="label">
          <span className="label-text">
            Episodes: {episodes} ({totalPrice} USDC)
          </span>
        </label>
        <input
          type="range"
          min={1}
          max={maxEpisodes}
          value={episodes}
          onChange={(e) => setEpisodes(Number(e.target.value))}
          className="range range-primary"
        />
        <div className="flex justify-between text-xs px-1">
          <span>1</span>
          <span>{maxEpisodes}</span>
        </div>
      </div>

      {/* Purchase button */}
      {!isConnected ? (
        <div className="alert alert-warning text-sm">
          Connect your wallet to purchase an agent.
        </div>
      ) : (
        <button
          className="btn btn-primary w-full"
          onClick={handlePurchase}
          disabled={
            purchaseAgent.isPending ||
            isSigningPayment ||
            !agentName.trim() ||
            !agentContext.trim() ||
            ((platform === "telegram" || platform === "discord") &&
              !botToken.trim())
          }
        >
          {isSigningPayment
            ? "Sign payment..."
            : purchaseAgent.isPending
              ? "Processing..."
              : `Purchase Agent (${totalPrice} USDC)`}
        </button>
      )}

      {purchaseAgent.isError && (
        <div className="alert alert-error text-sm">
          {purchaseAgent.error instanceof Error
            ? purchaseAgent.error.message
            : "Purchase failed"}
        </div>
      )}
    </div>
  );
}

export default function BonfirePage() {
  const { id } = useParams<{ id: string }>();

  const { data: bonfire, isLoading: bonfireLoading } = useQuery({
    queryKey: ["bonfire-detail", id],
    queryFn: () => fetchBonfireDetail(id),
    enabled: !!id,
  });

  const { data: pricing, isLoading: pricingLoading } = useBonfirePricing(id);
  const { data: agentsData } = useBonfireAgents(id);

  const isLoading = bonfireLoading || pricingLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!bonfire) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="alert alert-error">Bonfire not found</div>
      </div>
    );
  }

  const agentCount = agentsData?.agents?.length ?? 0;
  const maxAgents = pricing?.max_agents ?? 10;
  const isPurchasable = !!pricing?.price_per_episode;
  const isFull = agentCount >= maxAgents;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{bonfire.name}</h1>
        {bonfire.purpose && (
          <p className="text-base-content/70 mt-1">{bonfire.purpose}</p>
        )}
      </div>

      {/* Stats */}
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-title">Agents</div>
          <div className="stat-value text-lg">
            {agentCount} / {maxAgents}
          </div>
        </div>
        {isPurchasable && (
          <>
            <div className="stat">
              <div className="stat-title">Price / Episode</div>
              <div className="stat-value text-lg">
                {pricing!.price_per_episode} USDC
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Max Episodes</div>
              <div className="stat-value text-lg">
                {pricing!.max_episodes_per_agent}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Purchase section */}
      {isPurchasable && !isFull ? (
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title text-lg">Purchase Agent Slot</h2>
            <PurchaseForm
              bonfireId={id}
              pricePerEpisode={pricing!.price_per_episode!}
              maxEpisodes={pricing!.max_episodes_per_agent}
            />
          </div>
        </div>
      ) : isFull ? (
        <div className="alert alert-warning">
          This bonfire has reached its maximum agent capacity.
        </div>
      ) : (
        <div className="alert alert-info">
          This bonfire does not currently accept agent purchases.
        </div>
      )}
    </div>
  );
}
