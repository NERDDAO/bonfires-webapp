/**
 * useLatestEpisodesGraph
 *
 * Loads the agent's latest episodes graph (nodes + edges) from the same API
 * used by GraphExplorer: POST /api/agents/[agentId]/episodes/search.
 * Returns normalized GraphData for use in graph-2 StaticGraphView.
 */
"use client";

import type { AgentLatestEpisodesResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import type { GraphData, GraphEdge, GraphNode } from "@/types/graph";
import type { NodeType } from "@/types/graph";

/**
 * useLatestEpisodesGraph
 *
 * Loads the agent's latest episodes graph (nodes + edges) from the same API
 * used by GraphExplorer: POST /api/agents/[agentId]/episodes/search.
 * Returns normalized GraphData for use in graph-2 StaticGraphView.
 */

function resolveNodeType(rawType: unknown, labels: string[]): NodeType {
  const normalized = typeof rawType === "string" ? rawType.toLowerCase() : "";
  if (normalized.includes("episode")) return "episode";
  if (normalized.includes("entity")) return "entity";
  const hasEpisodeLabel = labels.some((l) => l.toLowerCase() === "episode");
  return hasEpisodeLabel ? "episode" : "entity";
}

function buildProperties(
  raw: Record<string, unknown>
): Record<string, unknown> {
  const base = { ...raw };
  if (raw["properties"] && typeof raw["properties"] === "object") {
    Object.assign(base, raw["properties"] as Record<string, unknown>);
  }
  return base;
}

function normalizeNode(raw: Record<string, unknown>): GraphNode | null {
  const rawUuid = String(
    raw["uuid"] ?? raw["id"] ?? raw["node_uuid"] ?? raw["nodeId"] ?? ""
  );
  const uuid = rawUuid.replace(/^n:/, "");
  if (!uuid) return null;

  const labels = Array.isArray(raw["labels"])
    ? raw["labels"].filter((l): l is string => typeof l === "string")
    : [];

  const nameCandidate =
    raw["name"] ?? raw["label"] ?? raw["title"] ?? raw["summary"] ?? uuid;
  const type = resolveNodeType(
    raw["type"] ?? raw["node_type"] ?? raw["entity_type"],
    labels
  );

  return {
    uuid,
    name: String(nameCandidate),
    type,
    labels,
    properties: buildProperties(raw),
  };
}

function normalizeNodeId(value: unknown): string {
  return String(value ?? "").replace(/^n:/, "");
}

function normalizeEdge(raw: Record<string, unknown>): GraphEdge | null {
  const sourceValue =
    raw["source"] ??
    raw["source_uuid"] ??
    raw["source_node_uuid"] ??
    raw["from_uuid"] ??
    raw["from"];
  const targetValue =
    raw["target"] ??
    raw["target_uuid"] ??
    raw["target_node_uuid"] ??
    raw["to_uuid"] ??
    raw["to"];

  if (!sourceValue || !targetValue) return null;

  const type = String(
    raw["type"] ??
      raw["relationship"] ??
      raw["relationship_type"] ??
      raw["label"] ??
      "related_to"
  );

  return {
    source: normalizeNodeId(sourceValue),
    target: normalizeNodeId(targetValue),
    type,
    properties: buildProperties(raw),
  };
}

export function latestEpisodesGraphQueryKey(
  bonfireId: string,
  agentId: string
) {
  return ["graph", "latest-episodes", bonfireId, agentId] as const;
}

export function useLatestEpisodesGraph({
  bonfireId,
  agentId,
  limit = 10,
  enabled = true,
}: {
  bonfireId: string | null;
  agentId: string | null;
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: latestEpisodesGraphQueryKey(bonfireId ?? "", agentId ?? ""),
    queryFn: async (): Promise<GraphData> => {
      if (!agentId || !bonfireId) {
        throw new Error("Agent and bonfire are required");
      }

      const response = await apiClient.post<AgentLatestEpisodesResponse>(
        `/api/agents/${agentId}/episodes/search`,
        { limit }
      );

      const rawNodes = [
        ...(response.nodes ?? []),
        ...(response.entities ?? []),
      ];
      const nodes = rawNodes
        .map((node) => normalizeNode(node as Record<string, unknown>))
        .filter((node): node is GraphNode => !!node);

      const edges = (response.edges ?? [])
        .map((edge) => normalizeEdge(edge as Record<string, unknown>))
        .filter((edge): edge is GraphEdge => !!edge);

      return {
        nodes,
        edges,
        metadata: {
          bonfire_id: bonfireId,
          agent_id: agentId,
          query: "latest_episodes",
          timestamp: new Date().toISOString(),
        },
      };
    },
    enabled: enabled && !!bonfireId && !!agentId,
    staleTime: 2 * 60 * 1000,
  });
}
