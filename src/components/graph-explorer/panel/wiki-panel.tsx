/**
 * WikiPanel Component
 * Displays wiki content for selected nodes (episodes, entities, edges)
 */

"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { WikiBreadcrumb, WikiMode } from "@/hooks";
import type { GraphElement } from "@/lib/utils/sigma-adapter";

// Types for wiki content
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

export interface WikiPanelProps {
  /** Selected node data */
  node: WikiNodeData | null;
  /** Selected edge data */
  edge: WikiEdgeData | null;
  /** Source node for edge (when edge is selected) */
  edgeSourceNode: WikiNodeData | null;
  /** Target node for edge (when edge is selected) */
  edgeTargetNode: WikiNodeData | null;
  /** Related edges for the selected node */
  nodeRelationships: WikiEdgeData[];
  /** Whether the wiki panel is enabled */
  enabled: boolean;
  /** Panel display mode */
  mode: WikiMode;
  /** Navigation breadcrumbs */
  breadcrumbs: WikiBreadcrumb[];
  /** Whether back navigation is available */
  canGoBack: boolean;
  /** Whether forward navigation is available */
  canGoForward: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Callback to toggle panel mode */
  onToggleMode: () => void;
  /** Callback to go back */
  onBack: () => void;
  /** Callback to go forward */
  onForward: () => void;
  /** Callback when a node is selected from wiki */
  onNodeSelect: (nodeId: string) => void;
  /** Callback to search around selected node */
  onSearchAroundNode?: (nodeUuid: string) => void;
  /** Resolve a node id to its display title (e.g. name). Used for relationship targets. */
  getRelatedNodeTitle?: (nodeId: string) => string | undefined;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format a date string for display
 */
function formatDate(dateStr?: string): string {
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
function formatLabel(str?: string): string {
  if (!str) return "";
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format a value for attribute display (no JSON brackets/syntax)
 */
function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
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

/**
 * WikiPanel - Content panel for nodes and edges
 */
export function WikiPanel({
  node,
  edge,
  edgeSourceNode,
  edgeTargetNode,
  nodeRelationships,
  enabled,
  mode,
  breadcrumbs,
  canGoBack,
  canGoForward,
  onClose,
  onToggleMode,
  onBack,
  onForward,
  onNodeSelect,
  onSearchAroundNode,
  getRelatedNodeTitle,
  className,
}: WikiPanelProps) {
  // Don't render if not enabled or no selection
  if (!enabled || (!node && !edge)) {
    return null;
  }

  const nodeType = node?.type || node?.node_type;
  const isEpisode = nodeType === "episode";

  // Determine what to render
  const renderContent = () => {
    // Edge content
    if (edge) {
      return (
        <div className="space-y-4">
          {/* Connection */}
          <section>
            <h3 className="text-sm font-semibold text-base-content/70 mb-2">
              Connection
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => edgeSourceNode && onNodeSelect(edgeSourceNode.uuid)}
                className="link text-base-content"
              >
                {edgeSourceNode?.name || edgeSourceNode?.label || edge.source}
              </button>
              <span className="text-base-content/50">→</span>
              <span className="badge badge-outline">
                {edge.label || edge.relation_type || "relates to"}
              </span>
              <span className="text-base-content/50">→</span>
              <button
                onClick={() => edgeTargetNode && onNodeSelect(edgeTargetNode.uuid)}
                className="link text-base-content"
              >
                {edgeTargetNode?.name || edgeTargetNode?.label || edge.target}
              </button>
            </div>
          </section>

          {/* Strength */}
          {typeof edge.strength === "number" && (
            <section>
              <h3 className="text-sm font-semibold text-base-content/70 mb-2">
                Strength
              </h3>
              <div className="flex items-center gap-2">
                <progress
                  className="progress progress-primary w-32"
                  value={edge.strength * 100}
                  max="100"
                />
                <span className="text-sm">{(edge.strength * 100).toFixed(0)}%</span>
              </div>
            </section>
          )}

          {/* Fact */}
          {(() => {
            const attributeFact = edge.attributes?.["fact"];
            const fact =
              typeof edge.fact === "string"
                ? edge.fact
                : typeof attributeFact === "string"
                  ? attributeFact
                  : undefined;
            if (!fact) return null;
            return (
              <section>
                <h3 className="text-sm font-semibold text-base-content/70 mb-2">
                  Fact
                </h3>
                <p className="text-sm text-base-content/80 leading-relaxed">
                  {fact}
                </p>
              </section>
            );
          })()}

          {/* Attributes */}
          {edge.attributes && Object.keys(edge.attributes).length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-base-content/70 mb-2">
                Attributes
              </h3>
              <div className="bg-base-200 rounded-lg p-3 overflow-auto max-h-48 space-y-1">
                {Object.entries(edge.attributes).map(([key, val]) => (
                  <div key={key} className="text-xs text-base-content/80">
                    <span className="font-medium text-base-content/90">{key}:</span>{" "}
                    {formatAttributeValue(val)}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      );
    }

    // Node content (episode or entity)
    if (node) {
      return (
        <div className="space-y-4">
          {/* Summary/Content */}
          {(node.summary || node.content) && (
            <section>
              <h3 className="text-sm font-semibold text-base-content/70 mb-2">
                {isEpisode ? "Summary" : "Description"}
              </h3>
              <p className="text-sm text-base-content/80 leading-relaxed">
                {node.summary || node.content}
              </p>
            </section>
          )}

          {/* Timeline (for episodes) */}
          {isEpisode && node.valid_at && (
            <section>
              <h3 className="text-sm font-semibold text-base-content/70 mb-2">
                Timeline
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="badge badge-outline badge-sm">
                  {formatDate(node.valid_at)}
                </span>
              </div>
            </section>
          )}

          {/* Attributes */}
          {node.attributes && Object.keys(node.attributes).length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-base-content/70 mb-2">
                Attributes
              </h3>
              <div className="bg-base-200 rounded-lg p-3 overflow-auto max-h-48 space-y-1">
                {Object.entries(node.attributes).map(([key, val]) => (
                  <div key={key} className="text-xs text-base-content/80">
                    <span className="font-medium text-base-content/90">{key}:</span>{" "}
                    {formatAttributeValue(val)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related (edges) */}
          {nodeRelationships.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-base-content/70 mb-2">
                Relationships ({nodeRelationships.length})
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {nodeRelationships.slice(0, 12).map((rel, idx) => {
                  const otherNodeId =
                    rel.source === `n:${node.uuid}` || rel.source === node.uuid
                      ? rel.target
                      : rel.source;
                  const cleanId = otherNodeId.replace(/^n:/, "");
                  const title = getRelatedNodeTitle?.(cleanId) ?? cleanId;
                  const relationLabel = formatLabel(
                    rel.label || rel.relation_type || "Related"
                  );
                  return (
                    <button
                      key={`${rel.id}-${idx}`}
                      onClick={() => onNodeSelect(cleanId)}
                      className="flex items-center gap-2 text-sm w-full p-2 rounded hover:bg-base-200 transition-colors text-left"
                    >
                      <span className="text-base-content/70 shrink-0">
                        {relationLabel}
                      </span>
                      <span className="font-bold text-base-content truncate min-w-0">
                        {title}
                      </span>
                    </button>
                  );
                })}
                {nodeRelationships.length > 12 && (
                  <div className="text-xs text-base-content/50 p-2">
                    + {nodeRelationships.length - 12} more
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      );
    }

    return null;
  };

  const canSearchAroundNode = !!node?.uuid && !!onSearchAroundNode;

  // Header badges: node labels, or for edges the relation type; fallback to type badge
  const headerBadges = edge
    ? [edge.label || edge.relation_type || "Relationship"]
    : (node?.labels && node.labels.length > 0)
      ? node.labels
      : [isEpisode ? "episode" : "entity"];

  return (
    <div className={cn("flex flex-col h-full min-h-0 bg-base-100", className)}>
      {/* Header: nav (sr-only) + labels as badges (title is on container) */}
      <div className="flex items-center justify-between p-3 border-b border-base-300 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <div className="sr-only flex items-center gap-1">
            <button
              onClick={onBack}
              disabled={!canGoBack}
              className="btn btn-ghost btn-xs btn-square"
              aria-label="Go back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onForward}
              disabled={!canGoForward}
              className="btn btn-ghost btn-xs btn-square"
              aria-label="Go forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {headerBadges.map((label, idx) => (
            <span
              key={idx}
              className={cn(
                "badge badge-sm",
                edge && "badge-warning",
                !edge && isEpisode && "badge-info",
                !edge && !isEpisode && "badge-success"
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Breadcrumbs (hidden, functionality preserved) */}
      {breadcrumbs.length > 1 && (
        <div className="sr-only px-3 py-2 border-b border-base-300 overflow-x-auto shrink-0">
          <div className="breadcrumbs text-xs">
            <ul>
              {breadcrumbs.map((crumb, idx) => (
                <li key={idx}>
                  {crumb.onClick ? (
                    <button onClick={crumb.onClick} className="link">
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-base-content/70">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">{renderContent()}</div>
      {canSearchAroundNode && (
        <div className="p-3 border-t border-base-300 shrink-0">
          <button
            onClick={() => onSearchAroundNode?.(node.uuid)}
            className="btn btn-primary btn-sm w-full"
            aria-label="Search around this node"
            title="Re-query the graph using this node as the center"
            type="button"
          >
            Search around this node
          </button>
        </div>
      )}
    </div>
  );
}

export default WikiPanel;
