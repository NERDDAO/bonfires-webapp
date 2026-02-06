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
        staticGraph={{
          staticBonfireId: "68962cbc2c14173dafbe6dc9",
          staticAgentId: "68cadde6d6ce58d6050e8f7a"
        }}
      />
    </div>
  );
}

export default function GraphPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[calc(100dvh-5rem)]">
          <span className="text-white/80">Loading graph...</span>
        </div>
      }
    >
      <GraphExplorerContent />
    </Suspense>
  );
}