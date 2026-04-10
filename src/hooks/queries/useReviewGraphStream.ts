"use client";

import { useMemo } from "react";

import type { GraphElement } from "@/lib/utils/sigma-adapter";
import type { BatchStreamState } from "./useBatchEvaluateStream";

/**
 * Build GraphElement[] from the SSE-accumulated graph state.
 *
 * The stream reducer accumulates:
 * - graphNodes: taxonomy entities (from graph:taxonomy), retrieval entities (from retrieval:hit)
 * - graphEdges: retrieval edges (from retrieval:hit)
 * - nodeActivations/edgeActivations: hit counts + timestamps for glow/growth
 *
 * No API fetches needed — the graph is built entirely from SSE events.
 */

export function useReviewGraphStream({
  streamState,
}: {
  streamState: BatchStreamState | undefined;
}) {
  const elements: GraphElement[] = useMemo(() => {
    if (!streamState) return [];
    const els: GraphElement[] = [];

    // Build node elements from accumulated graph nodes
    for (const [id, node] of streamState.graphNodes) {
      const activation = streamState.nodeActivations.get(id);
      els.push({
        data: {
          id,
          label: node.label,
          node_type: node.type.startsWith("taxonomy:") ? "entity" : node.type as "entity" | "episode",
          labels: node.type.startsWith("taxonomy:") ? ["Taxonomy", node.type.replace("taxonomy:", "")] : undefined,
          activationHitCount: activation?.hitCount,
          activationLastHitAt: activation?.lastHitAt,
        },
      });
    }

    // Build edge elements from accumulated graph edges
    for (const [key, edge] of streamState.graphEdges) {
      // Only add edge if both source and target nodes exist
      if (!streamState.graphNodes.has(edge.source) || !streamState.graphNodes.has(edge.target)) continue;
      const activation = streamState.edgeActivations.get(key);
      els.push({
        data: {
          id: key,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          activationHitCount: activation?.hitCount,
          activationLastHitAt: activation?.lastHitAt,
        },
      });
    }

    return els;
  }, [streamState]);

  // Determine if rotation should be active
  const isScoring = streamState?.graphPhase === "dispatch_scorers" ||
    streamState?.graphPhase === "build_trimtab";

  return { elements, isLoading: false, isScoring };
}
