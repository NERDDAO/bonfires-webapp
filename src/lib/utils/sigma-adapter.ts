/**
 * Sigma.js Graph Adapter
 * Converts graph data to graphology format for sigma.js rendering
 */
import { MultiDirectedGraph } from "graphology";
import type { Attributes } from "graphology-types";

import { NODE_COLOR_DEFAULTS } from "./graph-theme";

export interface NodeTypeColors {
  episodeColor?: string;
  entityColor?: string;
  unknownColor?: string;
  userColor?: string;
}

export interface SigmaNodeAttributes extends Attributes {
  label?: string;
  x: number;
  y: number;
  size: number;
  color: string;
  nodeType?: string;
  baseSize?: number;
  highlighted?: boolean;
  forceLabel?: boolean;
  labelColor?: string;
}

export interface SigmaEdgeAttributes extends Attributes {
  label?: string;
  size?: number;
  color?: string;
}

/** Element definition from graph data */
export interface GraphElementData {
  id: string;
  label?: string;
  labelFull?: string;
  labelShort?: string;
  name?: string;
  node_type?: "episode" | "entity" | "unknown";
  labels?: string[];
  source?: string;
  target?: string;
  relationship?: string;
  [key: string]: unknown;
}

export interface GraphElement {
  data: GraphElementData;
  classes?: string;
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncate(text: string, max = 64): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Converts GraphElement[] to a graphology Graph instance for sigma.js
 */
export function adaptToSigma(
  elements: GraphElement[] | undefined | null,
  nodeColors?: NodeTypeColors
): MultiDirectedGraph<SigmaNodeAttributes, SigmaEdgeAttributes> {
  // Create a multi-directed graph that allows multiple edges and self-loops
  const graph = new MultiDirectedGraph<
    SigmaNodeAttributes,
    SigmaEdgeAttributes
  >();

  // Use provided colors or fall back to defaults
  const colors = {
    episode: nodeColors?.episodeColor ?? NODE_COLOR_DEFAULTS.episodeColor,
    entity: nodeColors?.entityColor ?? NODE_COLOR_DEFAULTS.entityColor,
    unknown: nodeColors?.unknownColor ?? NODE_COLOR_DEFAULTS.unknownColor,
    user: nodeColors?.userColor ?? NODE_COLOR_DEFAULTS.userColor,
  };

  const usedNodeIds = new Map<string, number>();
  const usedEdgeIds = new Map<string, number>();

  if (!elements || elements.length === 0) {
    return graph;
  }

  // First pass: collect all nodes and edges
  const nodeElements: GraphElement[] = [];
  const edgeElements: GraphElement[] = [];

  for (const el of elements) {
    const data = el?.data || {};
    if (data && "source" in data && "target" in data) {
      edgeElements.push(el);
    } else {
      nodeElements.push(el);
    }
  }

  // Add nodes with random initial positions (layout will be applied later)
  for (const el of nodeElements) {
    const data = el?.data || {};
    const rawId = (data.id ?? "").toString();
    if (!rawId) continue;

    const baseId = rawId.replace(/^n:/, "");
    const seen = usedNodeIds.get(baseId) ?? 0;
    const uniqueId = seen === 0 ? baseId : `${baseId}__dup_${seen + 1}`;
    usedNodeIds.set(baseId, seen + 1);

    // Get the label value for display (truncated to 30 chars for sigma)
    const rawLabel = (data.labelFull ??
      data.label ??
      data.labelShort ??
      "") as string;
    const labelValue = truncate(rawLabel, 30);

    // Check if node has "User" in its labels array (case-insensitive)
    const labelsArray = data.labels as string[] | undefined;
    const hasUserLabel =
      labelsArray?.some(
        (lbl) => typeof lbl === "string" && lbl.toLowerCase() === "user"
      ) ?? false;

    // Set color based on labels array or node type
    const nodeType = data.node_type as string | undefined;
    const fillColor = hasUserLabel
      ? colors.user
      : nodeType === "episode"
        ? colors.episode
        : nodeType === "entity"
          ? colors.entity
          : colors.unknown;

    // Random initial positions (will be recalculated by force-directed layout)
    const x = Math.random() * 200 - 100;
    const y = Math.random() * 200 - 100;

    graph.addNode(uniqueId, {
      label: labelValue,
      x,
      y,
      size: 8,
      color: fillColor,
      nodeType: nodeType ?? "unknown",
    });
  }

  // Add edges
  for (const el of edgeElements) {
    const data = el?.data || {};
    const baseId = (data.id ?? `${data.source}->${data.target}`).toString();
    const seen = usedEdgeIds.get(baseId) ?? 0;
    const uniqueId = seen === 0 ? baseId : `${baseId}__dup_${seen + 1}`;
    usedEdgeIds.set(baseId, seen + 1);

    const sourceId = String(data.source).replace(/^n:/, "");
    const targetId = String(data.target).replace(/^n:/, "");

    // Only add edge if both nodes exist
    if (graph.hasNode(sourceId) && graph.hasNode(targetId)) {
      graph.addEdgeWithKey(uniqueId, sourceId, targetId, {
        label: (data.label ?? data.relationship ?? undefined) as
          | string
          | undefined,
        size: 1,
        color: "#555",
      });
    }
  }

  // Scale node sizes based on degree (number of connected edges)
  const MIN_NODE_SIZE = 6;
  const MAX_NODE_SIZE = 24;

  if (graph.order > 0) {
    // Find max degree for normalization
    let maxDegree = 1;
    graph.forEachNode((node) => {
      const degree = graph.degree(node);
      if (degree > maxDegree) maxDegree = degree;
    });

    // Update node sizes based on degree
    graph.forEachNode((node) => {
      const degree = graph.degree(node);
      // Use logarithmic scaling for better visual distribution
      const normalizedDegree = Math.log(degree + 1) / Math.log(maxDegree + 1);
      const size =
        MIN_NODE_SIZE + normalizedDegree * (MAX_NODE_SIZE - MIN_NODE_SIZE);
      graph.setNodeAttribute(node, "size", size);
    });
  }

  return graph;
}
