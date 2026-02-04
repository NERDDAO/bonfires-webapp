"use client";

import { NodeData } from "@/components";
import { GraphExplorer } from "@/components/graph-explorer";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function GraphExplorerPage() {
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
    <div className="min-h-[calc(100vh-5rem)] flex flex-col relative">
      <GraphExplorer
        initialBonfireId={bonfireId}
        initialAgentId={agentId}
        onCreateDataRoom={handleCreateDataRoom}
        className="flex-1"
      />
    </div>
  );
}