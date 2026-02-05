"use client";

import { NodeData } from "@/components";
import { GraphExplorer } from "@/components/graph-explorer/GraphExplorer";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function GraphExplorerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bonfireId = searchParams.get("bonfireId");
  const agentId = searchParams.get("agentId");

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
    <div className="min-h-[calc(100dvh-5rem)] flex flex-col relative">
      <GraphExplorer
        initialBonfireId={bonfireId}
        initialAgentId={agentId}
        onCreateDataRoom={handleCreateDataRoom}
        className="flex-1"
      />
    </div>
  );
}

export default function GraphExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100dvh-5rem)] flex flex-col relative items-center justify-center">
          <div className="animate-pulse text-muted-foreground">
            Loading graph explorer…
          </div>
        </div>
      }
    >
      <GraphExplorerContent />
    </Suspense>
  );
}