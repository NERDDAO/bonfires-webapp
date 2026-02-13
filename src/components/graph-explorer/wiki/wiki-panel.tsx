/**
 * WikiPanel Component
 * Displays wiki content for selected nodes (episodes, entities, edges)
 */
"use client";

import React from "react";

import type { WikiBreadcrumb, WikiMode } from "@/hooks";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/cn";

import { EdgeContent } from "./edge-content";
import { EntityContent } from "./entity-content";
import { EpisodeContent } from "./episode-content";
import {
  WikiEdgeData,
  WikiNodeData,
  parseEpisodeContent,
} from "./wiki-panel-utils";
import { Button } from "@/components/ui/button";

/**
 * WikiPanel Component
 * Displays wiki content for selected nodes (episodes, entities, edges)
 */

export type { WikiNodeData, WikiEdgeData };

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
  /** Whether the panel is on mobile */
  isMobile?: boolean;
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
  isMobile,
}: WikiPanelProps) {
  // Don't render if not enabled or no selection
  if (!enabled || (!node && !edge)) {
    return null;
  }

  const nodeType = node?.type || node?.node_type;
  const isEpisode = nodeType === "episode";

  // Determine what to render using dedicated content components
  const renderContent = () => {
    if (edge) {
      return (
        <EdgeContent
          edge={edge}
          edgeSourceNode={edgeSourceNode}
          edgeTargetNode={edgeTargetNode}
          onNodeSelect={onNodeSelect}
          getRelatedNodeTitle={getRelatedNodeTitle}
        />
      );
    }
    if (node) {
      if (isEpisode) {
        const episodeContent = parseEpisodeContent(node);
        return <EpisodeContent episode={episodeContent} />;
      }
      return (
        <EntityContent
          node={node}
          nodeRelationships={nodeRelationships}
          onNodeSelect={onNodeSelect}
          getRelatedNodeTitle={getRelatedNodeTitle}
        />
      );
    }
    return null;
  };

  const canSearchAroundNode = !!node?.uuid && !!onSearchAroundNode;

  // Header badges: node labels, or for edges the relation type; fallback to type badge
  const getHeaderBadges = () => {
    if (edge) {
      return ["Relationship"];
    }
    if (node?.labels && node.labels.length > 0) {
      return node.labels;
    }
    if (isEpisode) {
      return ["episode"];
    }
    return ["entity"];
  };

  const headerBadges = getHeaderBadges();

  return (
    <div className={cn("flex flex-col h-full min-h-0", className)}>
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

      {/* Wiki navigation breadcrumbs (sr-only) */}
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
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        <div className="flex flex-col bg-[#1C1D21] p-3 rounded-lg">
        {renderContent()}
        </div>
      </div>

      {(canSearchAroundNode || isMobile) && (
        <div className="p-3 border-t border-base-300 shrink-0">
          <div className="flex items-center gap-2">
            {canSearchAroundNode && (
              <Button
                variant="outline"
                showElevation={!isMobile}
                onClick={(e) => {
                  e.stopPropagation();
                  onSearchAroundNode?.(node.uuid);
                }}
                className={cn("z-10", isMobile ? "flex-1" : "w-full")}
                aria-label="Search around this node"
                title="Re-query the graph using this node as the center"
                type="button"
              >
                Search around this node
              </Button>
            )}
            {isMobile && (
              <Button
                variant="outline-white"
                showElevation={false}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className={cn("shrink-0", !canSearchAroundNode && "w-full")}
                aria-label="Close"
                type="button"
                innerClassName="text-white"
                borderColor="border-[#333333]"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WikiPanel;
