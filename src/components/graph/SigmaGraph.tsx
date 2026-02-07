/**
 * SigmaGraph Component
 * Low-level sigma.js graph rendering with interactivity
 */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  ZoomControl,
  useRegisterEvents,
  useSetSettings,
  useSigma,
} from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import type { MultiDirectedGraph } from "graphology";
import forceLayout from "graphology-layout-force";
import { NodeCircleProgram } from "sigma/rendering";

import {
  GraphThemeColors,
  NODE_COLOR_DEFAULTS,
  SigmaSettings,
} from "@/lib/utils/graph-theme";
import type {
  SigmaEdgeAttributes,
  SigmaNodeAttributes,
} from "@/lib/utils/sigma-adapter";

/**
 * SigmaGraph Component
 * Low-level sigma.js graph rendering with interactivity
 */

type WebGLSupportStatus = "unknown" | "supported" | "unsupported";

function detectWebGLSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return !!gl;
  } catch {
    return false;
  }
}

// Edge highlight colors
const EDGE_HIGHLIGHT_COLOR = GraphThemeColors.edgeHighlight;
const EDGE_DEFAULT_COLOR = GraphThemeColors.edgeFill;

// Sigma.js settings with node program registration
const sigmaSettings = {
  ...SigmaSettings,
  nodeProgramClasses: {
    circle: NodeCircleProgram,
  },
};

// Inner component that handles sigma events
interface SigmaEventsProps {
  onNodeClick: (nodeId: string) => void;
  onEdgeClick: (edgeId: string) => void;
  selectedNodeId?: string | null;
  highlightedNodeIds?: string[];
  isDraggingNodeRef: React.MutableRefObject<boolean>;
}

function SigmaEvents({
  onNodeClick,
  onEdgeClick,
  selectedNodeId,
  highlightedNodeIds,
  isDraggingNodeRef,
}: SigmaEventsProps) {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const setSettings = useSetSettings();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [cameraRatio, setCameraRatio] = useState(1);

  // Camera zoom tracking
  useEffect(() => {
    const camera = sigma.getCamera();
    const handleUpdated = () => {
      setCameraRatio(camera.getState().ratio);
    };
    camera.on("updated", handleUpdated);
    setCameraRatio(camera.getState().ratio);
    return () => {
      camera.off("updated", handleUpdated);
    };
  }, [sigma]);

  // Register node events
  useEffect(() => {
    registerEvents({
      clickNode: (event) => {
        if (isDraggingNodeRef.current) return;
        onNodeClick(event.node);
        setSelectedEdge(null);
      },
      enterNode: (event) => {
        setHoveredNode(event.node);
      },
      leaveNode: () => {
        setHoveredNode(null);
      },
      clickStage: () => {
        onNodeClick("");
        setSelectedEdge(null);
      },
    });
  }, [registerEvents, onNodeClick, isDraggingNodeRef]);

  // Register edge events directly on sigma instance
  useEffect(() => {
    const handleEnterEdge = ({ edge }: { edge: string }) => {
      setHoveredEdge(edge);
    };
    const handleLeaveEdge = () => {
      setHoveredEdge(null);
    };
    const handleClickEdge = ({ edge }: { edge: string }) => {
      setSelectedEdge((prev) => (prev === edge ? null : edge));
      onEdgeClick(edge);
    };

    sigma.on("enterEdge", handleEnterEdge);
    sigma.on("leaveEdge", handleLeaveEdge);
    sigma.on("clickEdge", handleClickEdge);

    return () => {
      sigma.off("enterEdge", handleEnterEdge);
      sigma.off("leaveEdge", handleLeaveEdge);
      sigma.off("clickEdge", handleClickEdge);
    };
  }, [sigma, onEdgeClick]);

  // Edge reducer for highlighting
  const activeEdge = hoveredEdge || selectedEdge;
  const activeNode = hoveredNode || selectedNodeId;
  const highlightedSet = useRef<Set<string>>(new Set());

  useEffect(() => {
    const normalized = (highlightedNodeIds ?? []).map((id) =>
      id.replace(/^n:/, "")
    );
    highlightedSet.current = new Set(normalized);
  }, [highlightedNodeIds]);

  useEffect(() => {
    const graph = sigma.getGraph();

    // Dynamic label sizes based on zoom
    const dynamicNodeLabelSize = Math.max(
      4,
      Math.min(40, 11 / Math.sqrt(cameraRatio))
    );
    const dynamicEdgeLabelSize = Math.max(
      4,
      Math.min(36, 10 / Math.sqrt(cameraRatio))
    );

    setSettings({
      labelSize: dynamicNodeLabelSize,
      edgeLabelSize: dynamicEdgeLabelSize,
      edgeReducer: (edge, data) => {
        const isDirectlyActive = edge === activeEdge;

        let isConnectedToActiveNode = false;
        if (activeNode && graph) {
          try {
            const source = graph.source(edge);
            const target = graph.target(edge);
            isConnectedToActiveNode =
              source === activeNode || target === activeNode;
          } catch {
            // Edge might not exist
          }
        }

        const isActive = isDirectlyActive || isConnectedToActiveNode;

        return {
          ...data,
          label: isActive ? data["label"] : undefined,
          color: isActive
            ? EDGE_HIGHLIGHT_COLOR
            : data["color"] || EDGE_DEFAULT_COLOR,
          size: isActive ? 4 : 2,
          zIndex: isActive ? 1 : 0,
        };
      },
    });
  }, [activeEdge, activeNode, setSettings, sigma, cameraRatio]);

  // Node highlighting
  useEffect(() => {
    try {
      const graph = sigma.getGraph();
      if (!graph || graph.order === 0) return;

      graph.forEachNode((node: string) => {
        const normalizedNodeId = node.replace(/^n:/, "");
        const isSelected =
          selectedNodeId === node || selectedNodeId === normalizedNodeId;
        const isHovered = hoveredNode === node;
        const isExternalHighlight =
          highlightedSet.current.has(normalizedNodeId);
        const isActive = isSelected || isHovered || isExternalHighlight;

        graph.setNodeAttribute(node, "highlighted", isActive);
        graph.setNodeAttribute(node, "forceLabel", isActive);

        if (isActive) {
          graph.setNodeAttribute(node, "labelColor", "#000000");
        } else {
          graph.removeNodeAttribute(node, "labelColor");
        }

        const baseSize =
          graph.getNodeAttribute(node, "baseSize") ??
          graph.getNodeAttribute(node, "size");
        if (!graph.hasNodeAttribute(node, "baseSize")) {
          graph.setNodeAttribute(node, "baseSize", baseSize);
        }

        if (isActive) {
          graph.setNodeAttribute(node, "size", baseSize * 1.3);
        } else {
          graph.setNodeAttribute(node, "size", baseSize);
        }
      });

      sigma.refresh();
    } catch {
      // WebGL context may not be ready
    }
  }, [hoveredNode, selectedNodeId, sigma, highlightedNodeIds]);

  return null;
}

// Layout controller component
interface LayoutControllerProps {
  runLayout: boolean;
  onLayoutComplete?: () => void;
}

function LayoutController({
  runLayout,
  onLayoutComplete,
}: LayoutControllerProps) {
  const sigma = useSigma();
  const layoutRunRef = useRef(false);

  useEffect(() => {
    if (runLayout && !layoutRunRef.current) {
      try {
        const graph = sigma.getGraph();

        if (graph && graph.order > 0) {
          layoutRunRef.current = true;

          const nodeCount = graph.order;
          const maxIterations = Math.max(500, Math.min(5000, nodeCount * 50));

          forceLayout.assign(graph, {
            maxIterations,
            settings: {
              attraction: 0.65,
              repulsion: 3,
              gravity: 10,
              inertia: 0.6,
              maxMove: 200,
            },
          });

          try {
            sigma.refresh();
          } catch {
            // WebGL context may have been disposed
          }
          onLayoutComplete?.();
        }
      } catch {
        // WebGL context may not be ready
      }
    }
  }, [runLayout, sigma, onLayoutComplete]);

  // Reset layout run ref when graph changes
  useEffect(() => {
    try {
      const graph = sigma.getGraph();
      if (graph) {
        layoutRunRef.current = false;
      }
    } catch {
      // Ignore if sigma not ready
    }
  }, [sigma]);

  return null;
}

// Node drag handler
interface NodeDragProps {
  isDraggingNodeRef: React.MutableRefObject<boolean>;
}

function NodeDrag({ isDraggingNodeRef }: NodeDragProps) {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const draggedNodeRef = useRef<string | null>(null);

  useEffect(() => {
    registerEvents({
      downNode: (e) => {
        isDraggingNodeRef.current = false;
        draggedNodeRef.current = e.node;
        sigma.getGraph().setNodeAttribute(e.node, "highlighted", true);
      },
      moveBody: ({ event }) => {
        if (!draggedNodeRef.current) return;

        isDraggingNodeRef.current = true;

        const pos = sigma.viewportToGraph({
          x: event.x,
          y: event.y,
        });

        sigma.getGraph().setNodeAttribute(draggedNodeRef.current, "x", pos.x);
        sigma.getGraph().setNodeAttribute(draggedNodeRef.current, "y", pos.y);

        event.preventSigmaDefault();
        event.original.preventDefault();
        event.original.stopPropagation();
      },
      upNode: () => {
        draggedNodeRef.current = null;
        setTimeout(() => {
          isDraggingNodeRef.current = false;
        }, 50);
      },
      upStage: () => {
        draggedNodeRef.current = null;
        setTimeout(() => {
          isDraggingNodeRef.current = false;
        }, 50);
      },
    });
  }, [registerEvents, sigma, isDraggingNodeRef]);

  return null;
}

export interface SigmaGraphProps {
  graph: MultiDirectedGraph<SigmaNodeAttributes, SigmaEdgeAttributes>;
  runLayout: boolean;
  onLayoutComplete: () => void;
  onNodeClick: (nodeId: string) => void;
  onEdgeClick: (edgeId: string) => void;
  selectedNodeId?: string | null;
  highlightedNodeIds?: string[];
}

export function SigmaGraph({
  graph,
  runLayout,
  onLayoutComplete,
  onNodeClick,
  onEdgeClick,
  selectedNodeId,
  highlightedNodeIds,
}: SigmaGraphProps) {
  const isDraggingNodeRef = useRef<boolean>(false);
  const [webglSupport, setWebglSupport] =
    useState<WebGLSupportStatus>("unknown");

  useEffect(() => {
    setWebglSupport(detectWebGLSupport() ? "supported" : "unsupported");
  }, []);

  useEffect(() => {
    if (webglSupport !== "unknown") return;

    const interval = window.setInterval(() => {
      setWebglSupport(detectWebGLSupport() ? "supported" : "unsupported");
    }, 500);

    return () => {
      window.clearInterval(interval);
    };
  }, [webglSupport]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event.message ?? "";
      if (message.includes("bindFramebuffer")) {
        setWebglSupport("unknown");
      }
    };

    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  if (webglSupport === "unknown") {
    return (
      <div className="flex items-center justify-center h-full text-base-content/60">
        Loading graph canvas...
      </div>
    );
  }

  if (webglSupport === "unsupported") {
    return (
      <div className="flex items-center justify-center h-full text-base-content/60">
        WebGL is unavailable. The graph view requires WebGL support.
      </div>
    );
  }

  return (
    <SigmaContainer
      graph={graph}
      settings={sigmaSettings}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <SigmaEvents
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        selectedNodeId={selectedNodeId}
        highlightedNodeIds={highlightedNodeIds}
        isDraggingNodeRef={isDraggingNodeRef}
      />
      <NodeDrag isDraggingNodeRef={isDraggingNodeRef} />
      <LayoutController
        runLayout={runLayout}
        onLayoutComplete={onLayoutComplete}
      />
      <ControlsContainer position="top-right">
        <ZoomControl />
        <FullScreenControl />
      </ControlsContainer>
    </SigmaContainer>
  );
}

export default SigmaGraph;
