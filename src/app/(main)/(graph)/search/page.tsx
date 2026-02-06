/**
 * Graph Search Page
 * Dedicated search interface for the knowledge graph
 */

"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import dynamicImport from "next/dynamic";

import { LoadingSpinner } from "@/components/common";
import { cn } from "@/lib/cn";
import type { NodeData } from "@/components/graph";

const GraphExplorer = dynamicImport(
  () => import("@/components/graph").then((mod) => mod.GraphExplorer),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading graph..." />
      </div>
    ),
  }
);

/**
 * Search page content with access to search params
 */
function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bonfireId = searchParams.get("bonfireId");
  const agentId = searchParams.get("agentId");
  const initialQuery = searchParams.get("q") ?? "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Handle search submission
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;

      const params = new URLSearchParams();
      if (bonfireId) params.set("bonfireId", bonfireId);
      if (agentId) params.set("agentId", agentId);
      params.set("q", searchQuery);

      router.push(`/search?${params.toString()}`);
    },
    [searchQuery, bonfireId, agentId, router]
  );

  // Handle Create Data Room action
  const handleCreateDataRoom = (nodeData: NodeData, bonfireId: string) => {
    const params = new URLSearchParams();
    params.set("bonfireId", bonfireId);
    params.set("centerNode", nodeData.id.replace(/^n:/, ""));
    params.set("nodeName", nodeData.label || nodeData.name || "");

    router.push(`/datarooms/create?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <header className="bg-base-100 border-b border-base-300 px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <Link
            href={`/graph${bonfireId ? `?bonfireId=${bonfireId}` : ""}${agentId ? `&agentId=${agentId}` : ""}`}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Back to graph"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="join w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search the knowledge graph..."
                className="input input-bordered join-item flex-1"
                autoFocus
              />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="btn btn-primary join-item"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Search tips */}
        {!initialQuery && (
          <div className="mt-3 text-sm text-base-content/60">
            <p>Tips: Search for entities, episodes, or relationships in the knowledge graph.</p>
          </div>
        )}
      </header>

      {/* Results */}
      {initialQuery ? (
        <div className="flex-1 overflow-hidden">
          <GraphExplorer
            initialBonfireId={bonfireId}
            initialAgentId={agentId}
            onCreateDataRoom={handleCreateDataRoom}
            className="h-full"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Search className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Search the Knowledge Graph</h2>
            <p className="text-base-content/60">
              Enter a search query to find entities, episodes, and relationships
              in the knowledge graph.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Graph Search page
 */
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading search..." />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
