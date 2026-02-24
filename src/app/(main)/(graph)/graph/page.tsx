"use client";

import { Suspense, useMemo } from "react";

import { useSearchParams } from "next/navigation";

import { siteCopy } from "@/content";
import { useSubdomainBonfire } from "@/contexts";

import { GraphExplorer } from "@/app/(main)/(graph)/graph/_components/graph-explorer";

function GraphExplorerContent() {
  const searchParams = useSearchParams();
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();

  const bonfireId = searchParams.get("bonfireId");
  const agentId = searchParams.get("agentId");

  const staticGraph = useMemo(() => {
    if (isSubdomainScoped && subdomainConfig) {
      return {
        staticBonfireId: subdomainConfig.bonfireId,
        staticAgentId: subdomainConfig.agentId ?? "",
      };
    }
    return siteCopy.staticGraph;
  }, [isSubdomainScoped, subdomainConfig]);

  const effectiveBonfireId =
    isSubdomainScoped && subdomainConfig
      ? subdomainConfig.bonfireId
      : bonfireId;
  const effectiveAgentId =
    isSubdomainScoped && subdomainConfig
      ? (subdomainConfig.agentId ?? agentId)
      : agentId;

  return (
    <div className="min-h-[calc(100dvh-5rem)] flex flex-col relative">
      <GraphExplorer
        initialBonfireId={effectiveBonfireId ?? undefined}
        initialAgentId={effectiveAgentId ?? undefined}
        className="flex-1"
        staticGraph={
          isSubdomainScoped && subdomainConfig
            ? staticGraph
            : siteCopy.staticGraph
        }
        hideGraphSelector={isSubdomainScoped && !!subdomainConfig}
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
