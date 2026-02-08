/**
 * WikiPanel Component
 * Displays wiki content for selected nodes (episodes, entities, edges)
 */
"use client";

import React from "react";

import type { WikiBreadcrumb, WikiMode } from "@/hooks";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

import { cn } from "@/lib/cn";
import type { GraphElement } from "@/lib/utils/sigma-adapter";

/**
 * WikiPanel Component
 * Displays wiki content for selected nodes (episodes, entities, edges)
 */

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
  /** Search-around history as breadcrumbs (clickable to navigate to that center) */
  searchHistoryBreadcrumbs?: { label: string; onClick: () => void }[];
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
  searchHistoryBreadcrumbs = [],
  canGoBack,
  canGoForward,
  onClose,
  onToggleMode,
  onBack,
  onForward,
  onNodeSelect,
  onSearchAroundNode,
  className,
}: WikiPanelProps) {
  // Don't render if not enabled or no selection
  if (!enabled || (!node && !edge)) {
    return null;
  }

  const isFullMode = mode === "full";
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
                onClick={() =>
                  edgeSourceNode && onNodeSelect(edgeSourceNode.uuid)
                }
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
                onClick={() =>
                  edgeTargetNode && onNodeSelect(edgeTargetNode.uuid)
                }
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
                <span className="text-sm">
                  {(edge.strength * 100).toFixed(0)}%
                </span>
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
              <div className="bg-base-200 rounded-lg p-3 overflow-auto max-h-48">
                <pre className="text-xs text-base-content/80">
                  {JSON.stringify(edge.attributes, null, 2)}
                </pre>
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

          {/* Labels (for entities) */}
          {node.labels && node.labels.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-base-content/70 mb-2">
                Labels
              </h3>
              <div className="flex flex-wrap gap-1">
                {node.labels.map((label, idx) => (
                  <span key={idx} className="badge badge-primary badge-sm">
                    {label}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Attributes */}
          {node.attributes && Object.keys(node.attributes).length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-base-content/70 mb-2">
                Attributes
              </h3>
              <div className="bg-base-200 rounded-lg p-3 overflow-auto max-h-48">
                <pre className="text-xs text-base-content/80">
                  {JSON.stringify(node.attributes, null, 2)}
                </pre>
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
                  return (
                    <button
                      key={`${rel.id}-${idx}`}
                      onClick={() => onNodeSelect(cleanId)}
                      className="flex items-center gap-2 text-sm w-full p-2 rounded hover:bg-base-200 transition-colors text-left"
                    >
                      <span className="badge badge-ghost badge-xs">
                        {rel.label || rel.relation_type || "related"}
                      </span>
                      <span className="text-primary truncate">{cleanId}</span>
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

  const title = edge
    ? edge.label || edge.relation_type || "Relationship"
    : node?.name || node?.label || node?.uuid?.slice(0, 8) || "Node";

  const typeBadge = edge ? "edge" : isEpisode ? "episode" : "entity";
  const canSearchAroundNode = !!node?.uuid && !!onSearchAroundNode;

  const panelContent = (
    <div
      className={cn(
        "flex flex-col h-full bg-base-100",
        isFullMode ? "rounded-lg shadow-xl" : "border-l border-base-300",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300">
        <div className="flex items-center gap-2 min-w-0">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
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

          {/* Title */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "badge badge-sm",
                typeBadge === "episode" && "badge-info",
                typeBadge === "entity" && "badge-success",
                typeBadge === "edge" && "badge-warning"
              )}
            >
              {typeBadge}
            </span>
            <h2 className="font-medium truncate">{title}</h2>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMode}
            className="btn btn-ghost btn-xs btn-square"
            aria-label={isFullMode ? "Minimize" : "Maximize"}
          >
            {isFullMode ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-square"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search history breadcrumbs (path of "search around" centers) */}
      {searchHistoryBreadcrumbs.length > 0 && (
        <div className="px-4 py-2 border-b border-base-300 overflow-x-auto">
          <div className="breadcrumbs text-xs">
            <ul>
              {searchHistoryBreadcrumbs.map((crumb, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={crumb.onClick}
                    className="link text-primary hover:underline"
                  >
                    {crumb.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Wiki navigation breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <div className="px-4 py-2 border-b border-base-300 overflow-x-auto">
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
      <div className="flex-1 overflow-y-auto p-4">{renderContent()}</div>
      {canSearchAroundNode && (
        <div className="p-4 border-t border-base-300">
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

  // Full mode: overlay
  if (isFullMode) {
    return (
      <div className="absolute inset-0 z-20 bg-base-100/95 backdrop-blur-sm rounded-lg overflow-hidden">
        {panelContent}
      </div>
    );
  }

  // Sidebar mode
  return <div className="w-80 h-full shrink-0">{panelContent}</div>;
}

export default WikiPanel;
