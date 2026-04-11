"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import GraphWrapper from "@/app/(main)/(graph)/graph/_components/graph/graph-wrapper";
import type { GraphElement } from "@/lib/utils/sigma-adapter";
import type { BatchStreamState } from "@/hooks/queries/useBatchEvaluateStream";
import { useReviewGraphStream } from "@/hooks/queries/useReviewGraphStream";
import { apiClient } from "@/lib/api/client";

interface BonfireGraphResponse {
  nodes: Array<{ id: string; label: string; type: string }>;
  edges: Array<{ id: string; source: string; target: string; label: string }>;
}

interface ReviewGraphPanelProps {
  /** Live mode: SSE stream state from batch evaluation */
  streamState?: BatchStreamState;
  /** Live mode: review bonfire ID for phase-boundary graph fetches */
  reviewBonfireId?: string;
  /** Live mode: dispatch expanded graph data into reducer */
  dispatchGraphExpand?: (
    nodes: Array<{ id: string; label: string; type: string }>,
    edges: Array<{ source: string; target: string; label: string }>,
  ) => void;
  /** Static mode: bonfire ID for completed review graph */
  bonfireId?: string;
  /** Static mode: agent ID */
  agentId?: string;
  /** Additional CSS classes */
  className?: string;
}

export function ReviewGraphPanel({
  streamState,
  reviewBonfireId,
  dispatchGraphExpand,
  bonfireId,
  agentId,
  className,
}: ReviewGraphPanelProps) {
  const isLiveMode = !!streamState;

  // Live mode: streaming graph with activations
  const {
    elements: liveElements,
    isLoading: liveLoading,
    isScoring,
  } = useReviewGraphStream({
    streamState: isLiveMode ? streamState : undefined,
    dispatchGraphExpand,
  });

  // Static mode: fetch complete bonfire graph
  const staticQuery = useQuery({
    queryKey: ["bonfireGraph", bonfireId],
    queryFn: async (): Promise<BonfireGraphResponse> => {
      return apiClient.get<BonfireGraphResponse>(
        `/api/knowledge-graph/bonfire-graph?bonfire_id=${bonfireId}`,
      );
    },
    enabled: !isLiveMode && !!bonfireId,
    staleTime: 5 * 60 * 1000,
  });

  const staticElements: GraphElement[] = useMemo(() => {
    if (!staticQuery.data) return [];
    const elements: GraphElement[] = [];
    for (const node of staticQuery.data.nodes) {
      if (!node.id) continue;
      elements.push({
        data: {
          id: node.id,
          label: node.label ?? "",
          node_type: (node.type ?? "entity") as "episode" | "entity" | "unknown",
        },
      });
    }
    for (const edge of staticQuery.data.edges) {
      if (!edge.source || !edge.target) continue;
      elements.push({
        data: {
          id: edge.id ?? `${edge.source}->${edge.target}`,
          source: edge.source,
          target: edge.target,
          label: edge.label ?? "",
        },
      });
    }
    return elements;
  }, [staticQuery.data]);

  const elements = isLiveMode ? liveElements : staticElements;
  const loading = isLiveMode ? liveLoading : staticQuery.isLoading;

  if (!isLiveMode && elements.length === 0 && !loading) return null;

  return (
    <div className={className}>
      <GraphWrapper
        elements={elements}
        loading={loading}
        rotating={isLiveMode && isScoring}
      />
    </div>
  );
}
