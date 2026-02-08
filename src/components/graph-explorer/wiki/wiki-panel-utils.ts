/**
 * Shared types and formatters for wiki panel content components.
 */

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
