/**
 * GraphVisualization Component
 * High-level graph visualization wrapper with loading states and error handling.
 * Renders the graph using CanvasGraphView (static-graph-view style UI).
 */

"use client";

import React, { useCallback, useMemo, memo, useRef, useEffect } from "react";

import { ErrorMessage, LoadingSpinner } from "@/components/common";
import type { GraphElement } from "@/lib/utils/sigma-adapter";
import ForceGraph from "./force-graph";

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
  /** Currently selected node ID */
  selectedNodeId?: string | null;
  /** Currently selected edge ID (for wiki panel and highlight) */
  selectedEdgeId?: string | null;
  /** Highlighted node IDs */
  highlightedNodeIds?: string[];
  /** Additional CSS class */
  className?: string;
}

/**
 * GraphVisualization - High-level graph rendering component
 * Handles transformation, loading states, and error display
 */
export const GraphVisualization = memo(function GraphVisualization({
  elements,
  loading = false,
  error,
  onNodeClick,
  onEdgeClick,
  selectedNodeId,
  selectedEdgeId,
  highlightedNodeIds,
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

  // Derive node/edge counts from elements for accessibility
  const { nodeCount, edgeCount } = useMemo(() => {
    const nodes = elements.filter(
      (el) =>
        el.data &&
        !(
          "source" in el.data &&
          "target" in el.data &&
          el.data.source != null &&
          el.data.target != null
        )
    ).length;
    const edges = elements.filter(
      (el) =>
        el.data &&
        "source" in el.data &&
        "target" in el.data &&
        el.data.source != null &&
        el.data.target != null
    ).length;
    return { nodeCount: nodes, edgeCount: edges };
  }, [elements]);

  // Error state
  if (error) {
    const errorMessage = typeof error === "string" ? error : error.message;
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <ErrorMessage message={errorMessage ?? "Failed to load graph"} variant="card" />
      </div>
    );
  }

  // Empty state (only after loading completed once)
  if (!loading && hasLoadedOnceRef.current && elements.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-base-content/60">
          <p className="text-lg font-medium">No graph data</p>
          <p className="text-sm mt-1">
            Select an agent and bonfire to explore the knowledge graph
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full ${className}`}
      role="application"
      aria-label={`Interactive knowledge graph with ${nodeCount} nodes and ${edgeCount} edges`}
      tabIndex={0}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-100/50">
          <LoadingSpinner size="lg" text="Loading graph..." />
        </div>
      )}

      {/* Accessibility summary */}
      <div className="sr-only" aria-live="polite">
        Graph summary: {nodeCount} nodes, {edgeCount} edges.
      </div>

      {/* Graph canvas (static-graph-view style) */}
      <ForceGraph
        elements={elements}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        selectedNodeId={selectedNodeId}
        selectedEdgeId={selectedEdgeId}
        highlightedNodeIds={highlightedNodeIds}
      />
    </div>
  );
});

GraphVisualization.displayName = "GraphVisualization";

export default GraphVisualization;
