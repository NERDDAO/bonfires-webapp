/**
 * GraphVisualization Component
 * High-level graph visualization wrapper with loading states and error handling
 */
"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import dynamic from "next/dynamic";

import { ErrorMessage, LoadingSpinner } from "@/components/common";

import { NODE_COLOR_DEFAULTS } from "@/lib/utils/graph-theme";
import {
  type GraphElement,
  type NodeTypeColors,
  adaptToSigma,
} from "@/lib/utils/sigma-adapter";

import type { SigmaGraphProps } from "./SigmaGraph";

/**
 * GraphVisualization Component
 * High-level graph visualization wrapper with loading states and error handling
 */

// Dynamically import SigmaGraph with SSR disabled to avoid WebGL errors
const SigmaGraph = dynamic<SigmaGraphProps>(
  () => import("./SigmaGraph").then((mod) => mod.SigmaGraph),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-base-100/50">
        <LoadingSpinner size="lg" text="Loading graph..." />
      </div>
    ),
  }
);

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
  /** Highlighted node IDs */
  highlightedNodeIds?: string[];
  /** Custom node colors */
  nodeColors?: NodeTypeColors;
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
  highlightedNodeIds,
  nodeColors,
  className,
}: GraphVisualizationProps) {
  // Track whether we've completed at least one load cycle
  const hasLoadedOnceRef = useRef(false);
  const wasLoadingRef = useRef(false);
  const [runLayout, setRunLayout] = useState(false);

  // Update hasLoadedOnce when loading transitions from true to false
  useEffect(() => {
    if (wasLoadingRef.current && !loading) {
      hasLoadedOnceRef.current = true;
      // Trigger layout after data loads
      setRunLayout(true);
    }
    wasLoadingRef.current = loading;
  }, [loading]);

  // Transform elements to graphology format
  const graph = useMemo(() => {
    const colors: NodeTypeColors = {
      episodeColor:
        nodeColors?.episodeColor ?? NODE_COLOR_DEFAULTS.episodeColor,
      entityColor: nodeColors?.entityColor ?? NODE_COLOR_DEFAULTS.entityColor,
      unknownColor:
        nodeColors?.unknownColor ?? NODE_COLOR_DEFAULTS.unknownColor,
      userColor: nodeColors?.userColor ?? NODE_COLOR_DEFAULTS.userColor,
    };

    return adaptToSigma(elements, colors);
  }, [elements, nodeColors]);

  // Event handlers
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

  // Handle layout completion
  const handleLayoutComplete = useCallback(() => {
    setRunLayout(false);
  }, []);

  // Memoize graph counts
  const { nodeCount, edgeCount } = useMemo(() => {
    return {
      nodeCount: graph.order,
      edgeCount: graph.size,
    };
  }, [graph]);

  // Error state
  if (error) {
    const errorMessage = typeof error === "string" ? error : error.message;
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <ErrorMessage
          message={errorMessage ?? "Failed to load graph"}
          variant="card"
        />
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

      {/* Graph canvas */}
      <SigmaGraph
        graph={graph}
        runLayout={runLayout}
        onLayoutComplete={handleLayoutComplete}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        selectedNodeId={selectedNodeId}
        highlightedNodeIds={highlightedNodeIds}
      />
    </div>
  );
});

GraphVisualization.displayName = "GraphVisualization";

export default GraphVisualization;
