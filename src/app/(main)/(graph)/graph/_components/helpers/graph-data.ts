/**
 * Graph data helpers: merge, convert to elements, parse API responses, extract episodes.
 */

import type { AgentLatestEpisodesResponse } from "@/types";
import type { GraphData, GraphEdge, GraphNode } from "@/types";
import { synthesizeEpisodicEdges } from "@/lib/utils/graph-utils";
import type { GraphElement } from "@/lib/utils/sigma-adapter";

import { asRecord, normalizeNode, normalizeNodeId, normalizeEdge, resolveNodeType } from "./graph-normalize";
import type { EpisodeTimelineItem } from "../select-panel/panel-types";

/**
 * Merge two graph datasets: dedupe nodes by id, edges by source|target|type.
 */
export function mergeGraphData(
  base: GraphData | null,
  incoming: GraphData | null
): GraphData | null {
  if (!base) return incoming;
  if (!incoming) return base;

  const nodeIds = new Set<string>();
  const mergedNodes: GraphData["nodes"] = [];

  const nodeIdFrom = (node: GraphData["nodes"][number]) => {
    const nodeRecord = asRecord(node);
    return String(
      nodeRecord["uuid"] ?? nodeRecord["id"] ?? ""
    ).replace(/^n:/, "");
  };

  for (const node of base.nodes) {
    const nodeId = nodeIdFrom(node);
    if (!nodeId || nodeIds.has(nodeId)) continue;
    nodeIds.add(nodeId);
    mergedNodes.push(node);
  }

  for (const node of incoming.nodes) {
    const nodeId = nodeIdFrom(node);
    if (!nodeId || nodeIds.has(nodeId)) continue;
    nodeIds.add(nodeId);
    mergedNodes.push(node);
  }

  const edgeKeys = new Set<string>();
  const mergedEdges: GraphData["edges"] = [];

  const addEdge = (edge: GraphData["edges"][number]) => {
    const edgeRecord = asRecord(edge);
    const sourceId = normalizeNodeId(
      edgeRecord["source"] ??
        edgeRecord["source_uuid"] ??
        edgeRecord["source_node_uuid"] ??
        edgeRecord["from_uuid"] ??
        edgeRecord["from"]
    );
    const targetId = normalizeNodeId(
      edgeRecord["target"] ??
        edgeRecord["target_uuid"] ??
        edgeRecord["target_node_uuid"] ??
        edgeRecord["to_uuid"] ??
        edgeRecord["to"]
    );
    if (!sourceId || !targetId) return;
    const edgeType = String(
      edgeRecord["type"] ??
        edgeRecord["relationship"] ??
        edgeRecord["relationship_type"] ??
        edgeRecord["label"] ??
        ""
    );
    const key = `${sourceId}|${targetId}|${edgeType}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    mergedEdges.push(edge);
  };

  for (const edge of base.edges) addEdge(edge);
  for (const edge of incoming.edges) addEdge(edge);

  return {
    nodes: mergedNodes,
    edges: mergedEdges,
    metadata: base.metadata ?? incoming.metadata,
  };
}

/**
 * Convert combined graph data + center node + node cache into sigma GraphElement[].
 */
export function graphDataToElements(
  combinedGraphData: GraphData | null,
  effectiveCenterNode: string | null,
  nodeCache: Map<string, GraphElement["data"]>
): GraphElement[] {
  if (!combinedGraphData) return [];

  const result: GraphElement[] = [];
  const nodeIds = new Set<string>();

  for (const node of combinedGraphData.nodes) {
    const nodeRecord = asRecord(node);
    const nodeId = String(
      nodeRecord["uuid"] ?? nodeRecord["id"] ?? ""
    ).replace(/^n:/, "");
    if (!nodeId || nodeIds.has(nodeId)) continue;
    nodeIds.add(nodeId);

    const rawLabels = nodeRecord["labels"];
    const labels = Array.isArray(rawLabels)
      ? rawLabels.filter(
          (label): label is string => typeof label === "string"
        )
      : [];
    const nodeType = resolveNodeType(
      nodeRecord["type"] ??
        nodeRecord["node_type"] ??
        nodeRecord["entity_type"],
      labels
    );
    const properties =
      (nodeRecord["properties"] as Record<string, unknown> | undefined) ??
      (nodeRecord["attributes"] as Record<string, unknown> | undefined) ??
      {};
    if (!("content" in properties) && nodeRecord["content"] !== undefined) {
      properties["content"] = nodeRecord["content"];
    }
    if (!("summary" in properties) && nodeRecord["summary"] !== undefined) {
      properties["summary"] = nodeRecord["summary"];
    }
    if (!("valid_at" in properties) && nodeRecord["valid_at"] !== undefined) {
      properties["valid_at"] = nodeRecord["valid_at"];
    }

    result.push({
      data: {
        id: `n:${nodeId}`,
        label: (nodeRecord["name"] ??
          nodeRecord["label"] ??
          nodeRecord["title"] ??
          "") as string | undefined,
        node_type: nodeType,
        labels,
        ...properties,
      },
    });
  }

  let edgeIndex = 0;
  for (const edge of combinedGraphData.edges) {
    const edgeRecord = asRecord(edge);
    const sourceValue =
      edgeRecord["source"] ??
      edgeRecord["source_uuid"] ??
      edgeRecord["source_node_uuid"] ??
      edgeRecord["from_uuid"] ??
      edgeRecord["from"];
    const targetValue =
      edgeRecord["target"] ??
      edgeRecord["target_uuid"] ??
      edgeRecord["target_node_uuid"] ??
      edgeRecord["to_uuid"] ??
      edgeRecord["to"];
    if (!sourceValue || !targetValue) continue;
    const sourceId = String(sourceValue).replace(/^n:/, "");
    const targetId = String(targetValue).replace(/^n:/, "");
    if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) continue;
    const uniqueEdgeId = `e:${sourceId}-${targetId}-${edgeIndex}`;
    edgeIndex += 1;
    const edgeType = (edgeRecord["type"] ??
      edgeRecord["relationship"] ??
      edgeRecord["relationship_type"] ??
      edgeRecord["label"]) as string | undefined;
    const edgeName = edgeRecord["name"] as string | undefined;
    const edgeFact = edgeRecord["fact"] as string | undefined;
    const properties =
      (edgeRecord["properties"] as Record<string, unknown> | undefined) ??
      (edgeRecord["attributes"] as Record<string, unknown> | undefined) ??
      (edgeRecord as Record<string, unknown>);

    result.push({
      data: {
        id: uniqueEdgeId,
        source: `n:${sourceId}`,
        target: `n:${targetId}`,
        label: edgeName ?? edgeType ?? edgeFact,
        name: edgeName,
        fact: edgeFact,
        relationship: edgeType,
        attributes: properties,
        ...properties,
      },
    });
  }

  const episodicEdges = synthesizeEpisodicEdges(
    combinedGraphData.edges,
    nodeIds
  );
  result.push(...episodicEdges);

  const centerId = effectiveCenterNode?.replace(/^n:/, "");
  if (centerId && !nodeIds.has(centerId)) {
    const cached = nodeCache.get(centerId);
    const cachedLabel =
      (cached?.label as string | undefined) ??
      (cached?.name as string | undefined) ??
      (cached?.["title"] as string | undefined);

    result.push({
      data: {
        ...(cached ?? {}),
        id: `n:${centerId}`,
        label: cachedLabel ?? `center:${centerId.slice(0, 8)}`,
        node_type:
          (cached?.node_type as "episode" | "entity" | undefined) ??
          "episode",
        placeholder: !cached,
      },
    });
    nodeIds.add(centerId);
  }

  return result;
}

export interface HydrationResult {
  graphData: GraphData;
  episodeItems: EpisodeTimelineItem[];
}

/**
 * Parse AgentLatestEpisodesResponse into graph data and episode list.
 * Optionally filter/sort episodes by latestEpisodeUuids.
 */
export function parseHydrationResponse(
  response: AgentLatestEpisodesResponse,
  bonfireId: string,
  agentId: string,
  latestEpisodeUuids: string[]
): HydrationResult {
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

  const graphData: GraphData = {
    nodes,
    edges,
    metadata: {
      bonfire_id: bonfireId,
      agent_id: agentId,
      query: "latest_episodes",
      timestamp: new Date().toISOString(),
    },
  };

  const responseEpisodes: EpisodeTimelineItem[] = (
    response.episodes ?? []
  ).map((episode) => {
    const episodeRecord = episode as Record<string, unknown>;
    return {
      uuid: String(episodeRecord["uuid"] ?? episodeRecord["id"] ?? ""),
      name: (episodeRecord["name"] ?? episodeRecord["title"]) as
        | string
        | undefined,
      valid_at: episodeRecord["valid_at"] as string | undefined,
      content: (episodeRecord["summary"] ?? episodeRecord["content"]) as
        | string
        | undefined,
    };
  });

  let episodeItems: EpisodeTimelineItem[] = responseEpisodes.filter(
    (episode) => episode.uuid
  );
  if (episodeItems.length === 0) {
    episodeItems = nodes
      .filter((node) => node.type === "episode" && !!node.uuid)
      .map((node) => ({
        uuid: node.uuid as string,
        name: node.name,
        valid_at: node.properties?.["valid_at"] as string | undefined,
        content: node.properties?.["summary"] as string | undefined,
      }));
  }

  if (latestEpisodeUuids.length > 0) {
    const episodeById = new Map(
      episodeItems.map((episode) => [episode.uuid, episode])
    );
    const filtered = latestEpisodeUuids.flatMap((uuid) => {
      const episode = episodeById.get(uuid);
      return episode ? [episode] : [];
    });
    if (filtered.length > 0) {
      episodeItems = filtered;
    }
  }

  return { graphData, episodeItems };
}

/**
 * Extract episode timeline items from graph nodes (e.g. after search/expand).
 */
export function extractEpisodesFromGraphNodes(
  nodes: GraphData["nodes"]
): EpisodeTimelineItem[] {
  return nodes
    .filter((n) => {
      const nodeRecord = asRecord(n);
      const nodeType = nodeRecord["type"] ?? nodeRecord["node_type"];
      return nodeType === "episode";
    })
    .map((n) => {
      const nodeRecord = asRecord(n);
      const properties =
        (nodeRecord["properties"] as Record<string, unknown> | undefined) ??
        (nodeRecord["attributes"] as Record<string, unknown> | undefined) ??
        {};
      return {
        uuid: String(nodeRecord["uuid"] ?? "").replace(/^n:/, ""),
        name: nodeRecord["name"] as string | undefined,
        valid_at: (properties["valid_at"] ?? nodeRecord["valid_at"]) as
          | string
          | undefined,
        content: (properties["content"] ?? nodeRecord["content"]) as
          | string
          | undefined,
      };
    });
}
