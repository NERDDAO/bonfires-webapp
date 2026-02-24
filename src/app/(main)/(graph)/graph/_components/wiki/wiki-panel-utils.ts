/**
 * Shared types and formatters for wiki panel content components.
 */

/** Minimal shape for graph element data (node or edge) when converting to wiki types. */
export interface RawGraphElementData {
  id?: string;
  label?: string;
  name?: string;
  node_type?: "episode" | "entity" | "unknown";
  labels?: string[];
  source?: string;
  target?: string;
  relationship?: string;
  rel_strength?: number;
  fact?: string;
  summary?: string;
  content?: string;
  valid_at?: string;
  attributes?: Record<string, unknown>;
}

export interface WikiNodeData {
  uuid: string;
  name?: string;
  label?: string;
  type?: "episode" | "entity";
  node_type?: "episode" | "entity";
  summary?: string;
  content?: string;
  valid_at?: string;
  attributes?: Record<string, unknown>;
  labels?: string[];
}

export interface WikiEdgeData {
  id: string;
  label?: string;
  relation_type?: string;
  source: string;
  target: string;
  strength?: number;
  fact?: string;
  attributes?: Record<string, unknown>;
}

export interface WikiEpisodeContent {
  name: string;
  content: string;
  valid_at?: string;
  updates?:
    | {
        description: string;
        attributes: Record<string, unknown>;
      }[]
    | null;
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return "Unknown date";
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

/**
 * Format CAPITAL_SNAKE_CASE or snake_case to "Capital snake case"
 */
export function formatLabel(str?: string): string {
  if (!str) return "";
  return str.replace(/_/g, " ").toLowerCase();
}

/**
 * Format a value for attribute display (no JSON brackets/syntax)
 */
export function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => formatAttributeValue(v)).join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${formatAttributeValue(v)}`)
      .join(" · ");
  }
  return String(value);
}

export function parseEpisodeContent(node?: WikiNodeData): WikiEpisodeContent {
  try {
    return JSON.parse(node?.content ?? "");
  } catch {
    return {
      name: node?.name ?? "",
      content: node?.content ?? "No summary available",
    };
  }
}

/**
 * Convert raw graph element data to WikiNodeData.
 */
export function elementToWikiNode(
  element: RawGraphElementData | null | undefined
): WikiNodeData | null {
  if (!element) return null;
  return {
    uuid: (element.id ?? "").replace(/^n:/, ""),
    name: (element.label ?? element.name) as string | undefined,
    label: element.label as string | undefined,
    type: element.node_type as "episode" | "entity" | undefined,
    node_type: element.node_type as "episode" | "entity" | undefined,
    summary: element.summary as string | undefined,
    content: element.content as string | undefined,
    valid_at: element.valid_at as string | undefined,
    attributes: element.attributes,
    labels: element.labels,
  };
}

/**
 * Convert raw graph element data to WikiEdgeData.
 */
export function elementToWikiEdge(
  element: RawGraphElementData | null | undefined
): WikiEdgeData | null {
  if (!element?.source || !element?.target) return null;
  return {
    id: element.id as string,
    label: element.name as string | undefined,
    relation_type:
      (element.relationship as string | undefined) ??
      (element.label as string | undefined),
    source: element.source as string,
    target: element.target as string,
    strength: element.rel_strength as number | undefined,
    fact: element.fact as string | undefined,
    attributes: element.attributes,
  };
}

/**
 * Resolve a node id to its display name using optional resolver or cleaned id.
 */
export function getNodeDisplayName(
  nodeId: string,
  getRelatedNodeTitle?: (nodeId: string) => string | undefined
): string {
  const cleanId = nodeId.replace(/^n:/, "");
  return getRelatedNodeTitle?.(cleanId) ?? cleanId ?? nodeId;
}

/**
 * Return header badge labels for the wiki panel (edge vs node type/labels).
 */
export function getHeaderBadges(
  node: WikiNodeData | null,
  edge: WikiEdgeData | null,
  isEpisode: boolean
): string[] {
  if (edge) return ["Relationship"];
  if (node?.labels?.length) return node.labels;
  if (isEpisode) return ["episode"];
  return ["entity"];
}
