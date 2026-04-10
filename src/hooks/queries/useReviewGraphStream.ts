"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { GraphElement } from "@/lib/utils/sigma-adapter";
import type { GraphData } from "@/types/graph";
import type { BatchStreamState } from "./useBatchEvaluateStream";
import { apiClient } from "@/lib/api/client";

/** Phases that produce meaningful graph data worth fetching. */
const GRAPH_FETCH_PHASES = new Set([
  "generate_ontology",
  "ingest_to_kg",
  "build_trimtab",
  "dispatch_scorers",
  "finalize_run",
]);

/** Convert GraphData to GraphElement[] (same logic as graph-explorer helpers). */
function graphDataToElements(data: GraphData | null): GraphElement[] {
  if (!data) return [];
  const elements: GraphElement[] = [];

  for (const node of data.nodes) {
    const id = node.uuid ?? node.id ?? "";
    if (!id) continue;
    elements.push({
      data: {
        id,
        label: node.name ?? node.label ?? node.title ?? "",
        node_type: (node.node_type ?? node.type ?? "entity") as "episode" | "entity" | "unknown",
        labels: node.labels,
        summary: node.summary,
        content: node.content,
        valid_at: node.valid_at,
      },
    });
  }

  for (const edge of data.edges) {
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
}

/** Merge activation state from the SSE stream into GraphElement[]. */
function applyActivations(
  elements: GraphElement[],
  nodeActivations: BatchStreamState["nodeActivations"],
  edgeActivations: BatchStreamState["edgeActivations"],
): GraphElement[] {
  return elements.map((el) => {
    const data = el.data;
    if (data.source && data.target) {
      // Edge element
      const edgeKey = `${data.source}->${data.target}`;
      const activation = edgeActivations.get(edgeKey);
      if (activation) {
        return {
          ...el,
          data: {
            ...data,
            activationHitCount: activation.hitCount,
            activationLastHitAt: activation.lastHitAt,
          },
        };
      }
    } else {
      // Node element
      const id = data.id as string;
      const activation = nodeActivations.get(id);
      if (activation) {
        return {
          ...el,
          data: {
            ...data,
            activationHitCount: activation.hitCount,
            activationLastHitAt: activation.lastHitAt,
          },
        };
      }
    }
    return el;
  });
}

interface UseReviewGraphStreamParams {
  streamState: BatchStreamState | undefined;
  reviewBonfireId: string | undefined;
}

export function useReviewGraphStream({
  streamState,
  reviewBonfireId,
}: UseReviewGraphStreamParams) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchedPhaseRef = useRef<string | null>(null);

  // Fetch graph data on phase transitions
  const fetchGraph = useCallback(async () => {
    if (!reviewBonfireId) return;
    setIsLoading(true);
    try {
      const response = await apiClient.post<GraphData>("/api/graph/query", {
        bonfire_id: reviewBonfireId,
        query: "relationships",
        num_results: 100,
      });
      if (response && "nodes" in response) {
        setGraphData(response as GraphData);
      }
    } catch (err) {
      console.warn("[useReviewGraphStream] graph fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [reviewBonfireId]);

  // Trigger fetch on phase transitions
  useEffect(() => {
    const phase = streamState?.graphPhase;
    if (!phase || !GRAPH_FETCH_PHASES.has(phase)) return;
    if (phase === lastFetchedPhaseRef.current) return;
    lastFetchedPhaseRef.current = phase;
    void fetchGraph();
  }, [streamState?.graphPhase, fetchGraph]);

  // Convert to elements with activation overlay
  const elements: GraphElement[] = useMemo(() => {
    const base = graphDataToElements(graphData);
    if (!streamState) return base;
    return applyActivations(base, streamState.nodeActivations, streamState.edgeActivations);
  }, [graphData, streamState]);

  // Determine if rotation should be active
  const isScoring = streamState?.graphPhase === "dispatch_scorers" ||
    streamState?.graphPhase === "build_trimtab";

  return { elements, isLoading, isScoring };
}
