/**
 * Force graph data: convert GraphElement[] to view nodes/links and helpers.
 */

import type { GraphElement } from "@/lib/utils/sigma-adapter";

import { RADIUS_BY_SIZE } from "./force-graph-constants";
import type { ViewLink, ViewNode } from "./force-graph-types";
import { getNodeColor } from "./force-graph-utils";

export function elementsToView(elements: GraphElement[]): {
  nodes: ViewNode[];
  links: { source: string; target: string; id: string; label: string }[];
} {
  const nodeById = new Map<string, ViewNode>();

  const nodeElements: GraphElement[] = [];
  const edgeElements: GraphElement[] = [];
  for (const el of elements) {
    const data = el?.data ?? {};
    if (
      data &&
      "source" in data &&
      "target" in data &&
      data.source != null &&
      data.target != null
    ) {
      edgeElements.push(el);
    } else {
      nodeElements.push(el);
    }
  }

  for (const el of nodeElements) {
    const data = el?.data ?? {};
    const rawId = String(data.id ?? "").replace(/^n:/, "");
    if (!rawId) continue;
    const label = String(
      data.labelFull ?? data.label ?? data.labelShort ?? data.name ?? rawId
    );
    const type = (data.node_type ?? "entity") as string;
    const size = String(type).toLowerCase().includes("episode") ? 4 : 3;
    const color = getNodeColor(
      data.node_type,
      data.labels as string[] | undefined
    );
    nodeById.set(rawId, { id: rawId, label, size, color });
  }

  const usedEdgeIds = new Map<string, number>();
  const links: { source: string; target: string; id: string; label: string }[] =
    [];
  for (const el of edgeElements) {
    const data = el?.data ?? {};
    const source = String(data.source ?? "").replace(/^n:/, "");
    const target = String(data.target ?? "").replace(/^n:/, "");
    if (!source || !target || !nodeById.has(source) || !nodeById.has(target))
      continue;
    const baseId = String(data.id ?? `${data.source}->${data.target}`);
    const seen = usedEdgeIds.get(baseId) ?? 0;
    const id = seen === 0 ? baseId : `${baseId}__dup_${seen + 1}`;
    usedEdgeIds.set(baseId, seen + 1);
    const label = String(data.label ?? data.relationship ?? "");
    links.push({ source, target, id, label });
  }

  return { nodes: Array.from(nodeById.values()), links };
}

export function clampNodesToBounds(
  nodes: ViewNode[],
  width: number,
  height: number
): void {
  for (const node of nodes) {
    const r = RADIUS_BY_SIZE[node.size] ?? 12;
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    node.x = Math.max(r, Math.min(width - r, x));
    node.y = Math.max(r, Math.min(height - r, y));
  }
}

/** Set of node IDs that are the hovered node plus all nodes connected to it by an edge */
export function getConnectedNodeIds(
  hoveredNodeId: string | null,
  links: ViewLink[]
): Set<string> {
  if (!hoveredNodeId) return new Set();
  const set = new Set<string>([hoveredNodeId]);
  for (const link of links) {
    const sid = link.source.id;
    const tid = link.target.id;
    if (sid === hoveredNodeId || tid === hoveredNodeId) {
      set.add(sid);
      set.add(tid);
    }
  }
  return set;
}
