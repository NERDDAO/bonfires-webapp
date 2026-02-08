"use client";

/**
 * PaidDelveInterface Component
 *
 * Payment-gated knowledge graph search interface.
 */
import { useState } from "react";

import { ConnectButton } from "@rainbow-me/rainbowkit";

import { useMicrosubSelection, usePaymentHeader } from "@/hooks/web3";

import {
  formatErrorMessage,
  isMicrosubError,
  truncateAddress,
} from "@/lib/utils";
import { useWalletAccount } from "@/lib/wallet/e2e";

interface DelveResponse {
  success: boolean;
  query: string;
  entities?: Array<{ name: string; summary?: string; uuid?: string }>;
  episodes?: Array<{ content?: string; summary?: string }>;
  metrics?: {
    entity_count?: number;
    episode_count?: number;
    edge_count?: number;
  };
  payment?: {
    verified: boolean;
    settled: boolean;
    tx_hash?: string;
    queries_remaining?: number;
  };
}

interface PaidDelveInterfaceProps {
  bonfireId: string;
  className?: string;
}

export function PaidDelveInterface({
  bonfireId,
  className = "",
}: PaidDelveInterfaceProps) {
  const { isConnected, address } = useWalletAccount();
  const { buildAndSignPaymentHeader, isLoading: isSigningPayment } =
    usePaymentHeader();
  const microsubSelection = useMicrosubSelection({ walletAddress: address });

  const [query, setQuery] = useState("");
  const [numResults, setNumResults] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DelveResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "results">(
    "overview"
  );
  const [isRetrying, setIsRetrying] = useState(false);

  const search = async (
    searchQuery: string,
    resultsCount: number,
    retrying: boolean
  ) => {
    setError(null);
    setIsLoading(true);

    try {
      if (!retrying) {
        const validation = microsubSelection.validateSelectedMicrosub();
        if (!validation.isValid) {
          setIsLoading(false);
          setError("Selected subscription is invalid.");
          return;
        }
      }

      const paymentHeader = microsubSelection.selectedMicrosub
        ? await buildAndSignPaymentHeader(undefined, true)
        : await buildAndSignPaymentHeader();

      const requestBody: Record<string, unknown> = {
        query: searchQuery,
        num_results: resultsCount,
        bonfire_id: bonfireId,
      };

      if (microsubSelection.selectedMicrosub) {
        requestBody["tx_hash"] = microsubSelection.selectedMicrosub.tx_hash;
      } else if (paymentHeader) {
        requestBody["payment_header"] = paymentHeader;
      }

      const response = await fetch(`/api/agents/${bonfireId}/delve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: DelveResponse = await response.json();
      setResults(data);
      setActiveTab("results");
      setIsRetrying(false);
      setIsLoading(false);
    } catch (err) {
      const microsubErrorInfo = isMicrosubError(err);

      if (microsubErrorInfo.isMicrosubError && !retrying) {
        microsubSelection.clearSelection();
        setIsRetrying(true);
        setTimeout(() => {
          search(searchQuery, resultsCount, true);
        }, 1000);
        return;
      }

      setError(formatErrorMessage(err));
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;

    const validation = microsubSelection.validateSelectedMicrosub();
    if (!validation.isValid) {
      setError("Selected subscription is invalid.");
      return;
    }

    await search(query, numResults, false);
  };

  if (!isConnected) {
    return (
      <div className={`card bg-base-200 shadow-xl ${className}`}>
        <div className="card-body items-center text-center">
          <h2 className="card-title">Connect Your Wallet</h2>
          <p>Please connect your wallet to search the knowledge graph.</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-[calc(100vh-4rem)] bg-base-100 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300">
        <h2 className="font-bold text-lg">Knowledge Graph Search</h2>
        {results?.payment && (
          <div className="badge badge-success gap-1">
            {results.payment.queries_remaining !== undefined
              ? `${results.payment.queries_remaining} queries left`
              : "Paid"}
          </div>
        )}
      </div>

      {/* Active subscription info */}
      {microsubSelection.selectedMicrosub?.description && (
        <div className="alert alert-info mx-4 mt-2">
          <div className="flex-1">
            <div className="text-sm font-semibold mb-1">
              📁 Data Room Active
            </div>
            <div className="text-xs opacity-80">
              {microsubSelection.selectedMicrosub.description}
            </div>
            {microsubSelection.selectedMicrosub.center_node_uuid && (
              <div className="text-xs opacity-70 mt-1">
                🎯 Center node:{" "}
                {truncateAddress(
                  microsubSelection.selectedMicrosub.center_node_uuid,
                  6
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="px-4 py-3 border-b border-base-300">
        <div className="flex gap-2">
          <input
            type="text"
            className="input input-bordered flex-1"
            placeholder="Enter your search query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            disabled={
              isLoading ||
              isSigningPayment ||
              microsubSelection.loading ||
              isRetrying
            }
          />
          <select
            className="select select-bordered"
            value={numResults}
            onChange={(e) => setNumResults(parseInt(e.target.value))}
            disabled={isLoading || microsubSelection.loading || isRetrying}
          >
            <option value={5}>5 results</option>
            <option value={10}>10 results</option>
            <option value={20}>20 results</option>
            <option value={50}>50 results</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={
              !query.trim() ||
              isLoading ||
              isSigningPayment ||
              microsubSelection.loading ||
              isRetrying
            }
          >
            {isRetrying ? (
              "Retrying..."
            ) : isLoading || isSigningPayment ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Search"
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error mx-4 mt-2">
          <span>{error}</span>
        </div>
      )}

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {results && (
          <div className="tabs tabs-boxed mb-4">
            <button
              className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === "results" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("results")}
            >
              Results (
              {(results.entities?.length || 0) +
                (results.episodes?.length || 0)}
              )
            </button>
          </div>
        )}

        {results && activeTab === "overview" && (
          <div className="stats stats-vertical lg:stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Entities</div>
              <div className="stat-value">
                {results.metrics?.entity_count || 0}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Episodes</div>
              <div className="stat-value">
                {results.metrics?.episode_count || 0}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Edges</div>
              <div className="stat-value">
                {results.metrics?.edge_count || 0}
              </div>
            </div>
          </div>
        )}

        {results && activeTab === "results" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold mb-2">
                Entities ({results.entities?.length || 0})
              </h3>
              {results.entities?.map((entity, idx) => (
                <div key={idx} className="card bg-base-200 shadow-sm mb-2">
                  <div className="card-body p-4">
                    <div className="badge badge-primary">Entity</div>
                    <p className="font-semibold">{entity.name || "Unnamed"}</p>
                    <p className="text-sm opacity-70">{entity.summary || ""}</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-bold mb-2">
                Episodes ({results.episodes?.length || 0})
              </h3>
              {results.episodes?.map((episode, idx) => (
                <div key={idx} className="card bg-base-200 shadow-sm mb-2">
                  <div className="card-body p-4">
                    <div className="badge badge-secondary">Episode</div>
                    <p className="text-sm">
                      {episode.content || episode.summary || ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!results && !isLoading && (
          <div className="text-center text-base-content/50 mt-20">
            Enter a query to search the knowledge graph.
          </div>
        )}
      </div>
    </div>
  );
}
