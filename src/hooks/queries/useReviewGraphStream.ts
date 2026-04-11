"use client";

import { useEffect, useMemo, useRef } from "react";

import type { GraphElement } from "@/lib/utils/sigma-adapter";
import type { BatchStreamState } from "./useBatchEvaluateStream";

const DELVE_API_URL = process.env["NEXT_PUBLIC_DELVE_API_URL"] || "http://localhost:8000";

interface ExpandResponse {
  success?: boolean;
  nodes?: Array<{ uuid?: string; name?: string; node_type?: string; labels?: string[]; summary?: string }>;
  edges?: Array<{ uuid?: string; name?: string; fact?: string; source_node_uuid?: string; target_node_uuid?: string; source?: string; target?: string; label?: string; edge_type?: string }>;
  episodes?: Array<{ uuid?: string; name?: string }>;
  num_results?: number;
}

export function useReviewGraphStream({
  streamState,
  dispatchGraphExpand,
}: {
  streamState: BatchStreamState | undefined;
  dispatchGraphExpand?: (
    nodes: Array<{ id: string; label: string; type: string }>,
    edges: Array<{ source: string; target: string; label: string }>,
  ) => void;
}) {
  // Track which episodes we've already expanded
  const expandedEpisodesRef = useRef<Set<string>>(new Set());

  // Expand new episodes when they appear in graphNodes
  useEffect(() => {
    if (!streamState || !dispatchGraphExpand) return;

    const reviewBonfireId = streamState.reviewBonfireId;
    if (!reviewBonfireId) return;

    // Find episode nodes that haven't been expanded yet
    const newEpisodeUuids: string[] = [];
    for (const [id, node] of streamState.graphNodes) {
      if (node.type === "episode" && !expandedEpisodesRef.current.has(id)) {
        newEpisodeUuids.push(id);
      }
    }

    if (newEpisodeUuids.length === 0) return;

    // Mark as expanding immediately to prevent double-expand
    for (const uuid of newEpisodeUuids) {
      expandedEpisodesRef.current.add(uuid);
    }

    const expand = async () => {
      try {
        console.log(`[ReviewGraphStream] expanding ${newEpisodeUuids.length} episodes via /knowledge_graph/episodes/expand`);
        const response = await fetch(`${DELVE_API_URL}/knowledge_graph/episodes/expand`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            episode_uuids: newEpisodeUuids,
            bonfire_id: reviewBonfireId,
            limit: 50,
          }),
        });

        if (!response.ok) {
          console.warn("[ReviewGraphStream] episode expand failed:", response.status);
          return;
        }

        const data: ExpandResponse = await response.json();

        const nodes: Array<{ id: string; label: string; type: string }> = [];
        const edges: Array<{ source: string; target: string; label: string }> = [];

        // Parse nodes from response
        if (data.nodes) {
          for (const n of data.nodes) {
            const id = n.uuid ?? "";
            if (!id) continue;
            const nodeType = n.node_type ?? "entity";
            nodes.push({ id, label: n.name ?? "", type: nodeType });
          }
        }

        // Parse edges from expand_episodes response
        // Edge shape: {source_node_uuid, target_node_uuid, name, fact, edge_type, ...}
        if (data.edges) {
          for (const e of data.edges) {
            const source = e.source_node_uuid ?? e.source ?? "";
            const target = e.target_node_uuid ?? e.target ?? "";
            if (!source || !target) continue;
            edges.push({ source, target, label: e.name ?? e.label ?? e.fact ?? "" });
          }
        }

        if (nodes.length > 0 || edges.length > 0) {
          console.log(`[ReviewGraphStream] expand returned ${nodes.length} nodes, ${edges.length} edges`);
          dispatchGraphExpand(nodes, edges);
        }
      } catch (err) {
        console.warn("[ReviewGraphStream] episode expand error:", err);
      }
    };

    void expand();
  }, [streamState?.graphNodes.size, streamState?.reviewBonfireId, dispatchGraphExpand]);

  const elements: GraphElement[] = useMemo(() => {
    if (!streamState) return [];
    const els: GraphElement[] = [];

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

    const edgeTotal = streamState.graphEdges.size;
    let edgeSkipped = 0;
    for (const [key, edge] of streamState.graphEdges) {
      if (!streamState.graphNodes.has(edge.source) || !streamState.graphNodes.has(edge.target)) {
        edgeSkipped++;
        continue;
      }
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

    if (edgeTotal > 0) {
      console.log(`[ReviewGraphStream] nodes: ${streamState.graphNodes.size}, edges total: ${edgeTotal}, rendered: ${edgeTotal - edgeSkipped}, skipped: ${edgeSkipped}`);
    }

    return els;
  }, [streamState]);

  const isScoring = streamState?.graphPhase === "dispatch_scorers" ||
    streamState?.graphPhase === "build_trimtab";

  return { elements, isLoading: false, isScoring };
}
