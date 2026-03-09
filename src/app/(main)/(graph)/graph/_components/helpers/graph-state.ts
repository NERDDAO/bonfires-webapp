/**
 * Graph state helpers: build payloads for chat/API (e.g. graph state snapshot).
 */

import type { GraphStatePayload } from "@/types";
import type { GraphElement } from "@/lib/utils/sigma-adapter";

import { normalizeNodeId } from "./graph-normalize";

export function buildGraphStatePayload(
  elements: GraphElement[],
  centerNodeId: string | null
): GraphStatePayload {
  const nodes: GraphStatePayload["nodes"] = [];
  const edges: GraphStatePayload["edges"] = [];

  for (const element of elements) {
    if (!element.data) continue;
    const data = { ...element.data } as GraphStatePayload["nodes"][number]["data"];

    if (typeof data.node_type === "string") {
      nodes.push({
        data,
        classes: element.classes,
      });
      continue;
    }

    if (data.source && data.target) {
      edges.push({
        data,
        classes: element.classes,
      });
    }
  }

  return {
    nodes,
    edges,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    centerNodeUuid: centerNodeId
      ? normalizeNodeId(centerNodeId) || undefined
      : undefined,
    lastUpdated: new Date().toISOString(),
  };
}
