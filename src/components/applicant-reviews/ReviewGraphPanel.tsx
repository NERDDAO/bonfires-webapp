"use client";

import { useMemo } from "react";

import GraphWrapper from "@/app/(main)/(graph)/graph/_components/graph/graph-wrapper";
import type { GraphElement } from "@/lib/utils/sigma-adapter";
import type { BatchStreamState } from "@/hooks/queries/useBatchEvaluateStream";
import { useReviewGraphStream } from "@/hooks/queries/useReviewGraphStream";
import { useGraphQuery } from "@/hooks/queries/useGraphQuery";

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

  // Static mode: fetch complete graph
  const staticQuery = useGraphQuery({
    bonfire_id: bonfireId ?? "",
    search_query: "relationships",
    limit: 200,
    enabled: !isLiveMode && !!bonfireId,
  });

  const staticElements: GraphElement[] = useMemo(() => {
    if (!staticQuery.data) return [];
    const elements: GraphElement[] = [];
    for (const node of staticQuery.data.nodes) {
      const id = node.uuid ?? node.id ?? "";
      if (!id) continue;
      elements.push({
        data: {
          id,
          label: node.name ?? node.label ?? node.title ?? "",
          node_type: (node.node_type ?? node.type ?? "entity") as "episode" | "entity" | "unknown",
        },
      });
    }
    for (const edge of staticQuery.data.edges) {
      const source = edge.source ?? "";
      const target = edge.target ?? "";
      if (!source || !target) continue;
      elements.push({
        data: {
          id: `${source}->${target}`,
          source,
          target,
          label: edge.label ?? edge.relationship ?? edge.name ?? "",
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
