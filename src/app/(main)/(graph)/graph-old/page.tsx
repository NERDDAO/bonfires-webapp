/**
 * Graph Explorer Page
 * Main graph visualization and exploration interface
 */
"use client";

import { Suspense } from "react";

import dynamicImport from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";

import { LoadingSpinner } from "@/components/common";
import type { NodeData } from "@/components/graph";
import { Header } from "@/components/shared/Header";

/**
 * Graph Explorer Page
 * Main graph visualization and exploration interface
 */

export const dynamic = "force-dynamic";

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
 * Graph page content with access to search params
 */
function GraphPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bonfireId = searchParams.get("bonfireId");
  const agentId = searchParams.get("agentId");
  const hideHeader = searchParams.get("hideHeader") === "1";

  // Handle Create Data Room action
  const handleCreateDataRoom = (nodeData: NodeData, bonfireId: string) => {
    // Navigate to data room creation with pre-filled data
    const params = new URLSearchParams();
    params.set("bonfireId", bonfireId);
    params.set("centerNode", nodeData.id.replace(/^n:/, ""));
    params.set("nodeName", nodeData.label || nodeData.name || "");

    router.push(`/datarooms/create?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      {!hideHeader && <Header />}
      <GraphExplorer
        initialBonfireId={bonfireId}
        initialAgentId={agentId}
        onCreateDataRoom={handleCreateDataRoom}
        className="flex-1"
      />
    </div>
  );
}

/**
 * Graph Explorer page
 */
export default function GraphPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading graph explorer..." />
        </div>
      }
    >
      <GraphPageContent />
    </Suspense>
  );
}
