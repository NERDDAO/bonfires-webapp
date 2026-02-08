"use client";

/**
 * DataRoomMarketplaceCard Component
 *
 * Card component for displaying data room information in the marketplace.
 * Includes subscribe and create blog actions.
 */
import { useState } from "react";

import { useRouter } from "next/navigation";

import type { DataRoomInfo } from "@/types";

import { usePaymentHeader } from "@/hooks/web3";

import { formatTimestamp, truncateAddress, truncateText } from "@/lib/utils";
import { useWalletAccount } from "@/lib/wallet/e2e";

interface DataRoomMarketplaceCardProps {
  dataroom: DataRoomInfo;
  className?: string;
  onHyperBlogCreated?: (dataroomId: string) => void;
  onSubscribed?: (dataroomId: string) => void;
}

export function DataRoomMarketplaceCard({
  dataroom,
  className = "",
  onSubscribed,
}: DataRoomMarketplaceCardProps) {
  const router = useRouter();
  const { isConnected } = useWalletAccount();
  const { buildAndSignPaymentHeader } = usePaymentHeader();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const handleSubscribe = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isConnected || isSubscribing) return;

    setIsSubscribing(true);

    try {
      const priceDecimal = dataroom.price_usd.toFixed(2);
      const paymentHeader = await buildAndSignPaymentHeader(priceDecimal);

      if (!paymentHeader) {
        setIsSubscribing(false);
        return;
      }

      const requestBody = {
        dataroom_id: dataroom.id,
        payment_header: paymentHeader,
        expected_amount: priceDecimal,
      };

      const response = await fetch("/api/microsubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create subscription");
      }

      const data = await response.json();
      const txHash = data.microsub?.tx_hash || data.tx_hash;

      if (txHash) {
        localStorage.setItem("selectedMicrosubTxHash", txHash);
      }

      onSubscribed?.(dataroom.id);
      router.push(`/x402-chat?dataroom=${dataroom.id}`);
    } catch (err) {
      console.error("Subscription error:", err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/datarooms/${dataroom.id}`);
  };

  const truncatedDescription = truncateText(dataroom.description, 150);
  const shouldTruncate = dataroom.description.length > 150;

  // Determine the current price (use dynamic price if available)
  const currentPrice = dataroom.price_usd;

  return (
    <div
      className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-2 gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span className="text-2xl mt-0.5">📁</span>
            <div className="flex-1 min-w-0">
              <h2 className="card-title text-lg leading-tight mb-2">
                {truncateText(dataroom.description, 100) ||
                  "Untitled Data Room"}
              </h2>
              {dataroom.bonfire_name && (
                <span className="badge badge-info badge-sm">
                  {dataroom.bonfire_name}
                </span>
              )}
            </div>
          </div>
          {dataroom.is_active ? (
            <span className="badge badge-success badge-sm flex-shrink-0">
              Active
            </span>
          ) : (
            <span className="badge badge-ghost badge-sm flex-shrink-0">
              Inactive
            </span>
          )}
        </div>

        {/* Creator Badge */}
        <div className="mb-2">
          <span className="badge badge-outline badge-sm">
            by{" "}
            {dataroom.creator_name ||
              dataroom.creator_username ||
              (dataroom.creator_wallet
                ? truncateAddress(dataroom.creator_wallet, 6)
                : "Anonymous")}
          </span>
        </div>

        {/* Full Description */}
        {shouldTruncate && (
          <div className="mb-3">
            <p className="text-sm opacity-80">
              {isDescriptionExpanded
                ? dataroom.description
                : truncatedDescription}
            </p>
            <button
              className="btn btn-ghost btn-xs mt-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsDescriptionExpanded(!isDescriptionExpanded);
              }}
            >
              {isDescriptionExpanded ? "Show less" : "Read more"}
            </button>
          </div>
        )}

        {/* Pricing & Limits */}
        <div className="flex flex-wrap gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1">
            <span>💰</span>
            <span className="font-semibold">
              ${currentPrice.toFixed(2)} USD
            </span>
            {dataroom.dynamic_pricing_enabled && (
              <span className="badge badge-warning badge-xs">Dynamic</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span>📊</span>
            <span>{dataroom.query_limit} queries</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⏰</span>
            <span>{dataroom.expiration_days} days</span>
          </div>
        </div>

        {/* Center Node */}
        {dataroom.center_node_uuid && (
          <div className="mb-3 bg-base-200/50 border border-base-content/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-base-content/70 uppercase tracking-wide">
              <span>🎯</span>
              <span>Focus Node</span>
            </div>
            <div className="text-xs text-base-content/50 mt-1">
              {truncateAddress(dataroom.center_node_uuid, 8)}
            </div>
          </div>
        )}

        {/* Configuration Indicators */}
        <div className="flex flex-wrap gap-2 mb-3">
          {dataroom.system_prompt && (
            <span className="badge badge-accent badge-sm">🤖 Custom AI</span>
          )}
        </div>

        {/* Metadata */}
        <div className="text-xs opacity-70 mb-4">
          Created {formatTimestamp(dataroom.created_at)}
        </div>

        {/* Actions */}
        <div
          className="card-actions justify-end flex-wrap gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubscribe}
            disabled={isSubscribing || !dataroom.is_active || !isConnected}
          >
            {isSubscribing ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : !isConnected ? (
              "Connect Wallet"
            ) : !dataroom.is_active ? (
              "Inactive"
            ) : (
              "Subscribe"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
