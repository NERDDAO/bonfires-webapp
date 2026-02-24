"use client";


import { Button } from "@/components/ui/button";

import { cn } from "@/lib/cn";

import { EdgeContent } from "./edge-content";
import { EntityContent } from "./entity-content";
import { EpisodeContent } from "./episode-content";
import {
  type WikiEdgeData,
  type WikiNodeData,
  getHeaderBadges,
  parseEpisodeContent,
} from "./wiki-panel-utils";

/**
 * WikiPanel Component
 * Displays wiki content for selected nodes (episodes, entities, edges)
 */

export interface WikiPanelProps {
  /** Selected node data */
  node: WikiNodeData | null;
  /** Selected edge data */
  edge: WikiEdgeData | null;
  /** Related edges for the selected node */
  nodeRelationships: WikiEdgeData[];
  /** Whether the wiki panel is enabled */
  enabled: boolean;
  /** Callback to close the panel */
  onClose: () => void;
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
  nodeRelationships,
  enabled,
  onClose,
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
  const headerBadges = getHeaderBadges(node, edge, isEpisode);

  return (
    <div className={cn("flex flex-col h-full min-h-0", className)}>
      {/* Header: labels as badges (title is on container) */}
      <div className="flex items-center justify-between p-3 border-b border-base-300 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
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
