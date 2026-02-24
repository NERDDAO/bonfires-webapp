/**
 * GraphVisualization Component
 * High-level graph visualization wrapper with loading states and error handling.
 * Renders the graph using CanvasGraphView (static-graph-view style UI).
 */
"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";

import { ErrorMessage, LoadingSpinner } from "@/components/common";

import type { GraphElement } from "@/lib/utils/sigma-adapter";

import GraphStatusOverlay from "../ui/graph-status-overlay";
import ForceGraph from "./force-graph";

/**
 * GraphVisualization Component
 * High-level graph visualization wrapper with loading states and error handling.
 * Renders the graph using CanvasGraphView (static-graph-view style UI).
 */

interface GraphVisualizationProps {
  /** Graph elements to display */
  elements: GraphElement[];
  /** Whether the graph is currently loading */
  loading?: boolean;
  /** Error to display */
  error?: Error | string | null;
  /** Callback when a node is clicked */
  onNodeClick?: (nodeId: string) => void;
  /** Callback when an edge is clicked */
  onEdgeClick?: (edgeId: string) => void;
  /** Callback when the background is clicked (clear selection, keep e.g. wiki panel open) */
  onBackgroundClick?: () => void;
  /** Currently selected node ID */
  selectedNodeId?: string | null;
  /** Currently selected edge ID (for wiki panel and highlight) */
  selectedEdgeId?: string | null;
  /** Highlighted node IDs */
  highlightedNodeIds?: string[];
  /** Center node ID: when set, the graph view is panned so this node is at the viewport center on load */
  centerNodeId?: string | null;
  /** One-shot: when set, pan the view so this node is at center (no graph update) */
  panToNodeId?: string | null;
  /** Called after panning to panToNodeId so the parent can clear it */
  onPanToNodeComplete?: () => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * GraphVisualization - High-level graph rendering component
 * Handles transformation, loading states, and error display
 */
export const GraphWrapper = memo(function GraphWrapper({
  elements,
  loading = false,
  error,
  onNodeClick,
  onEdgeClick,
  onBackgroundClick,
  selectedNodeId,
  selectedEdgeId,
  highlightedNodeIds,
  centerNodeId,
  panToNodeId,
  onPanToNodeComplete,
  className,
}: GraphVisualizationProps) {
  // Track whether we've completed at least one load cycle
  const hasLoadedOnceRef = useRef(false);
  const wasLoadingRef = useRef(false);

  // Update hasLoadedOnce when loading transitions from true to false
  useEffect(() => {
    if (wasLoadingRef.current && !loading) {
      hasLoadedOnceRef.current = true;
    }
    wasLoadingRef.current = loading;
  }, [loading]);

  // Event handlers: CanvasGraphView passes clean node ids; pass through to parent
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      const cleanId = nodeId.startsWith("n:") ? nodeId.slice(2) : nodeId;
      onNodeClick?.(cleanId);
    },
    [onNodeClick]
  );

  const handleEdgeClick = useCallback(
    (edgeId: string) => {
      onEdgeClick?.(edgeId);
    },
    [onEdgeClick]
  );

  // Error state
  if (error) {
    const errorMessage = typeof error === "string" ? error : error.message;
    return (
      <GraphStatusOverlay
        isLoading={false}
        isError={true}
        errorMessage={errorMessage}
      />
    );
  }

  // Empty state (only after loading completed once)
  if (!loading && hasLoadedOnceRef.current && elements.length === 0) {
    return (
      <GraphStatusOverlay
        isLoading={false}
        isError={true}
        errorMessage="Graph data not found"
      />
    );
  }

  return (
    <div
      className={`relative w-full h-full ${className}`}
      role="application"
      tabIndex={0}
    >
      {/* Loading overlay */}
      {loading && (
        <GraphStatusOverlay isLoading={true} message="Loading graph..." />
      )}

      {/* Graph canvas (static-graph-view style) */}
      <ForceGraph
        elements={elements}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onBackgroundClick={onBackgroundClick}
        selectedNodeId={selectedNodeId}
        selectedEdgeId={selectedEdgeId}
        highlightedNodeIds={highlightedNodeIds}
        centerNodeId={centerNodeId}
        panToNodeId={panToNodeId}
        onPanToNodeComplete={onPanToNodeComplete}
      />
    </div>
  );
});

GraphWrapper.displayName = "GraphWrapper";

export default GraphWrapper;
