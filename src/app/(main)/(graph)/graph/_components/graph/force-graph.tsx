"use client";

/**
 * CanvasGraphView
 *
 * Renders the graph with the same visual style as static-graph-view: canvas,
 * node size by type, d3 force layout, drag/pan/zoom. Accepts GraphElement[]
 * and callbacks so it plugs into GraphVisualization without changing core logic.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import * as d3 from "d3";

import type { GraphElement } from "@/lib/utils/sigma-adapter";

import { IconButton } from "../ui/icon-button";
import {
  ALPHA_DECAY,
  CENTER_STRENGTH,
  CHARGE_STRENGTH,
  COLLISION_PADDING,
  GRAPH_HEIGHT,
  GRAPH_WIDTH,
  LAYOUT_ALPHA_MIN,
  LINK_DISTANCE,
  LINK_STRENGTH,
  RADIUS_BY_SIZE,
  VELOCITY_DECAY,
  ZOOM_MAX,
  ZOOM_MIN,
} from "./force-graph-constants";
import {
  clampNodesToBounds,
  elementsToView,
} from "./force-graph-data";
import {
  draw,
  edgeUnderPoint,
  getTouchCenter,
  getTouchDistance,
  nodeUnderPoint,
} from "./force-graph-canvas";
import type { ForceGraphProps, ViewLink, ViewNode } from "./force-graph-types";

export type { ForceGraphProps };

export default function ForceGraph({
  elements,
  onNodeClick,
  onEdgeClick,
  onBackgroundClick,
  selectedNodeId,
  selectedEdgeId,
  highlightedNodeIds = [],
  centerNodeId,
  panToNodeId,
  onPanToNodeComplete,
  className,
}: ForceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<ViewNode[] | null>(null);
  const linksRef = useRef<ViewLink[] | null>(null);
  const hoveredNodeRef = useRef<string | null>(null);
  const hoveredEdgeRef = useRef<string | null>(null);
  const draggedNodeRef = useRef<ViewNode | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const simulationRef = useRef<d3.Simulation<ViewNode, ViewLink> | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const graphSizeRef = useRef({
    graphWidth: GRAPH_WIDTH,
    graphHeight: GRAPH_HEIGHT,
  });
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const panStartRef = useRef<{
    clientX: number;
    clientY: number;
    tx: number;
    ty: number;
  } | null>(null);
  const didPanRef = useRef(false);
  const lastLogicalRef = useRef({ x: 0, y: 0 });
  /** True only after mousedown on the canvas; used so mouseup on window (e.g. button in wiki panel) doesn't trigger graph click. */
  const pointerDownOnCanvasRef = useRef(false);
  const touchStartRef = useRef<{
    clientX: number;
    clientY: number;
    tx: number;
    ty: number;
    nodeId: string | null;
    edgeId: string | null;
  } | null>(null);
  const pinchStartRef = useRef<{
    distance: number;
    centerClientX: number;
    centerClientY: number;
    tx: number;
    ty: number;
    k: number;
  } | null>(null);
  const TOUCH_PAN_THRESHOLD_PX = 10;
  const [, setTick] = useState(0);

  const highlightedSet = useRef(new Set<string>());
  highlightedSet.current = new Set(
    highlightedNodeIds.map((id) => id.replace(/^n:/, ""))
  );
  if (selectedNodeId) {
    highlightedSet.current.add(selectedNodeId.replace(/^n:/, ""));
  }

  const onNodeClickRef = useRef(onNodeClick);
  const onEdgeClickRef = useRef(onEdgeClick);
  const onBackgroundClickRef = useRef(onBackgroundClick);
  onNodeClickRef.current = onNodeClick;
  onEdgeClickRef.current = onEdgeClick;
  onBackgroundClickRef.current = onBackgroundClick;

  const redraw = useCallback(() => setTick((t) => t + 1), []);

  const zoomBy = useCallback(
    (factor: number) => {
      const { width, height } = sizeRef.current;
      if (width <= 0 || height <= 0) return;
      const t = transformRef.current;
      const newK = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, t.k * factor));
      const centerSimX = (width / 2 - t.x) / t.k;
      const centerSimY = (height / 2 - t.y) / t.k;
      transformRef.current = {
        x: width / 2 - newK * centerSimX,
        y: height / 2 - newK * centerSimY,
        k: newK,
      };
      redraw();
    },
    [redraw]
  );

  // One-shot pan to node (e.g. when episode is selected from list) — only updates view transform
  useEffect(() => {
    if (!panToNodeId) return;
    const nodes = nodesRef.current;
    const { width, height } = sizeRef.current;
    if (!nodes || width <= 0 || height <= 0) {
      onPanToNodeComplete?.();
      return;
    }
    const normalizedId = panToNodeId.replace(/^n:/, "");
    const node = nodes.find(
      (n) => n.id === normalizedId || n.id === panToNodeId
    );
    if (!node || node.x == null || node.y == null) {
      onPanToNodeComplete?.();
      return;
    }
    const t = transformRef.current;
    transformRef.current = {
      x: width / 2 - node.x * t.k,
      y: height / 2 - node.y * t.k,
      k: t.k,
    };
    redraw();
    onPanToNodeComplete?.();
  }, [panToNodeId, redraw, onPanToNodeComplete]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !elements.length) {
      nodesRef.current = null;
      linksRef.current = null;
      simulationRef.current?.stop();
      simulationRef.current?.on("tick", null);
      simulationRef.current = null;
      return;
    }

    simulationRef.current?.stop();
    simulationRef.current?.on("tick", null);
    simulationRef.current = null;

    const { nodes: viewNodes, links: viewLinks } = elementsToView(elements);
    const nodes: ViewNode[] = viewNodes.map((n) => ({ ...n }));
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const links: ViewLink[] = viewLinks
      .map(({ source, target, id, label }) => {
        const src = nodeById.get(source);
        const tgt = nodeById.get(target);
        if (!src || !tgt) return null;
        return { source: src, target: tgt, id, label };
      })
      .filter((l): l is ViewLink => l != null);
    nodesRef.current = nodes;
    linksRef.current = links;

    const resize = (isInitialLayout: boolean) => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width <= 0 || height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const graphWidth = GRAPH_WIDTH;
      const graphHeight = GRAPH_HEIGHT;
      graphSizeRef.current = { graphWidth, graphHeight };

      if (isInitialLayout) {
        const simulation = d3
          .forceSimulation(nodes)
          .alphaDecay(ALPHA_DECAY)
          .velocityDecay(VELOCITY_DECAY);
        simulation
          .force(
            "link",
            d3
              .forceLink(links)
              .id((d) => (d as ViewNode).id)
              .distance(LINK_DISTANCE)
              .strength(LINK_STRENGTH)
          )
          .force("charge", d3.forceManyBody().strength(CHARGE_STRENGTH))
          .force("center", d3.forceCenter(graphWidth / 2, graphHeight / 2))
          .force("x", d3.forceX(graphWidth / 2).strength(CENTER_STRENGTH))
          .force("y", d3.forceY(graphHeight / 2).strength(CENTER_STRENGTH))
          .force(
            "collision",
            d3
              .forceCollide<ViewNode>()
              .radius((d) => (RADIUS_BY_SIZE[d.size] ?? 12) + COLLISION_PADDING)
          );

        while (simulation.alpha() > LAYOUT_ALPHA_MIN) {
          simulation.tick();
        }
        simulation.stop();
        simulationRef.current = simulation;

        clampNodesToBounds(nodes, graphWidth, graphHeight);
        for (const node of nodes) {
          node.x0 = node.x;
          node.y0 = node.y;
        }

        const centerId = centerNodeId?.replace(/^n:/, "") ?? null;
        const centerNode = centerId
          ? nodes.find((n) => n.id === centerId)
          : null;
        if (centerNode && centerNode.x != null && centerNode.y != null) {
          transformRef.current = {
            x: width / 2 - centerNode.x,
            y: height / 2 - centerNode.y,
            k: 1,
          };
        } else {
          transformRef.current = {
            x: width / 2 - graphWidth / 2,
            y: height / 2 - graphHeight / 2,
            k: 1,
          };
        }
      }

      sizeRef.current = { width, height };
      const selectedNode = selectedNodeId?.replace(/^n:/, "") ?? null;
      draw(
        ctx,
        nodes,
        links,
        width,
        height,
        null,
        null,
        null,
        selectedNode,
        highlightedSet.current,
        transformRef.current
      );
    };

    resize(true);
    const ro = new ResizeObserver(() => resize(false));
    ro.observe(container);

    const toLayoutClient = (clientX: number, clientY: number) => {
      const vv = typeof window !== "undefined" ? window.visualViewport : null;
      if (vv) {
        return { x: clientX + vv.offsetLeft, y: clientY + vv.offsetTop };
      }
      return { x: clientX, y: clientY };
    };

    const toLogical = (e: {
      clientX: number;
      clientY: number;
    }): { x: number; y: number } => {
      const { width, height } = sizeRef.current;
      const rect = canvas.getBoundingClientRect();
      const { x: layoutX, y: layoutY } = toLayoutClient(e.clientX, e.clientY);
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      const canvasX = (layoutX - rect.left) * scaleX;
      const canvasY = (layoutY - rect.top) * scaleY;
      const t = transformRef.current;
      return {
        x: (canvasX - t.x) / t.k,
        y: (canvasY - t.y) / t.k,
      };
    };

    const onSimulationTick = () => {
      const n = nodesRef.current;
      const { graphWidth, graphHeight } = graphSizeRef.current;
      if (n?.length) {
        clampNodesToBounds(n, graphWidth, graphHeight);
      }
      redraw();
      const sim = simulationRef.current;
      if (!sim) return;
      if (draggedNodeRef.current) {
        sim.alpha(0.25);
      } else if (sim.alpha() < LAYOUT_ALPHA_MIN) {
        sim.stop();
        sim.on("tick", null);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (draggedNodeRef.current || panStartRef.current) return;
      pointerDownOnCanvasRef.current = true;
      const { x, y } = toLogical(e);
      lastLogicalRef.current = { x, y };
      const node = nodeUnderPoint(nodes, x, y);
      if (node) {
        draggedNodeRef.current = node;
        didDragRef.current = false;
        dragOffsetRef.current = {
          x: x - (node.x ?? 0),
          y: y - (node.y ?? 0),
        };
      } else {
        didPanRef.current = false;
        panStartRef.current = {
          clientX: e.clientX,
          clientY: e.clientY,
          tx: transformRef.current.x,
          ty: transformRef.current.y,
        };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const panStart = panStartRef.current;
      if (panStart) {
        didPanRef.current = true;
        transformRef.current.x = panStart.tx + (e.clientX - panStart.clientX);
        transformRef.current.y = panStart.ty + (e.clientY - panStart.clientY);
        redraw();
        return;
      }
      const { x, y } = toLogical(e);
      const node = draggedNodeRef.current;
      const offset = dragOffsetRef.current;
      const { graphWidth, graphHeight } = graphSizeRef.current;
      if (node && offset) {
        if (!didDragRef.current) {
          const dx = x - lastLogicalRef.current.x;
          const dy = y - lastLogicalRef.current.y;
          if (dx * dx + dy * dy > 16) {
            didDragRef.current = true;
            const nx = node.x ?? 0;
            const ny = node.y ?? 0;
            node.fx = nx;
            node.fy = ny;
            const sim = simulationRef.current;
            if (sim) {
              sim.on("tick", onSimulationTick);
              sim.alpha(0.4).restart();
            }
          }
        }
        if (didDragRef.current) {
          const r = RADIUS_BY_SIZE[node.size] ?? 12;
          const nx = Math.max(r, Math.min(graphWidth - r, x - offset.x));
          const ny = Math.max(r, Math.min(graphHeight - r, y - offset.y));
          node.x = nx;
          node.y = ny;
          node.x0 = nx;
          node.y0 = ny;
          node.fx = nx;
          node.fy = ny;
          redraw();
        }
      } else {
        lastLogicalRef.current = { x, y };
        const edgeUnder = edgeUnderPoint(links, x, y);
        const nodeUnder = nodeUnderPoint(nodes, x, y);
        hoveredEdgeRef.current = edgeUnder?.id ?? null;
        hoveredNodeRef.current = nodeUnder?.id ?? null;
        redraw();
      }
    };

    const handleMouseLeave = () => {
      hoveredNodeRef.current = null;
      hoveredEdgeRef.current = null;
      redraw();
    };

    const handleMouseUp = () => {
      const startedOnCanvas = pointerDownOnCanvasRef.current;
      pointerDownOnCanvasRef.current = false;

      const node = draggedNodeRef.current;
      const wasPanning = panStartRef.current != null;
      const didPan = didPanRef.current;

      if (startedOnCanvas) {
        if (node && !didDragRef.current) {
          onNodeClickRef.current?.(node.id);
        } else if (!didDragRef.current && linksRef.current) {
          const { x, y } = lastLogicalRef.current;
          const edgeUnder = edgeUnderPoint(linksRef.current, x, y);
          if (edgeUnder) {
            onEdgeClickRef.current?.(edgeUnder.id);
          } else if (wasPanning && !didPan && nodesRef.current) {
            const nodeUnder = nodeUnderPoint(nodesRef.current, x, y);
            if (!nodeUnder) {
              onBackgroundClickRef.current?.();
            }
          }
        }
        if (node && didDragRef.current) {
          node.fx = node.x;
          node.fy = node.y;
        }
      }
      draggedNodeRef.current = null;
      dragOffsetRef.current = null;
      panStartRef.current = null;
      didPanRef.current = false;
      didDragRef.current = false;
      redraw();
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / (window.devicePixelRatio ?? 1) / rect.width;
      const scaleY =
        canvas.height / (window.devicePixelRatio ?? 1) / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;
      const t = transformRef.current;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newK = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, t.k * factor));
      const simX = (canvasX - t.x) / t.k;
      const simY = (canvasY - t.y) / t.k;
      transformRef.current = {
        x: canvasX - newK * simX,
        y: canvasY - newK * simY,
        k: newK,
      };
      redraw();
    };

    const getTouchCoords = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return null;
      return { clientX: t.clientX, clientY: t.clientY };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        touchStartRef.current = null;
        const distance = getTouchDistance(e.touches);
        const center = getTouchCenter(e.touches);
        const t = transformRef.current;
        pinchStartRef.current = {
          distance,
          centerClientX: center.clientX,
          centerClientY: center.clientY,
          tx: t.x,
          ty: t.y,
          k: t.k,
        };
        e.preventDefault();
        return;
      }
      if (
        e.touches.length !== 1 ||
        panStartRef.current ||
        touchStartRef.current
      )
        return;
      e.preventDefault();
      const coords = getTouchCoords(e);
      if (!coords) return;
      const { x, y } = toLogical(coords);
      const node = nodeUnderPoint(nodes, x, y);
      const edge = edgeUnderPoint(links, x, y);
      touchStartRef.current = {
        clientX: coords.clientX,
        clientY: coords.clientY,
        tx: transformRef.current.x,
        ty: transformRef.current.y,
        nodeId: node?.id ?? null,
        edgeId: edge?.id ?? null,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartRef.current) {
        e.preventDefault();
        const pinch = pinchStartRef.current;
        const distance = getTouchDistance(e.touches);
        const center = getTouchCenter(e.touches);
        if (distance <= 0) return;
        const scale = distance / pinch.distance;
        const newK = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pinch.k * scale));
        const rect = canvas.getBoundingClientRect();
        const { width, height } = sizeRef.current;
        const scaleX = width / rect.width;
        const scaleY = height / rect.height;
        const { x: layoutX0, y: layoutY0 } = toLayoutClient(
          pinch.centerClientX,
          pinch.centerClientY
        );
        const centerCanvasX0 = (layoutX0 - rect.left) * scaleX;
        const centerCanvasY0 = (layoutY0 - rect.top) * scaleY;
        const graphX = (centerCanvasX0 - pinch.tx) / pinch.k;
        const graphY = (centerCanvasY0 - pinch.ty) / pinch.k;
        const { x: layoutX, y: layoutY } = toLayoutClient(
          center.clientX,
          center.clientY
        );
        const centerCanvasX = (layoutX - rect.left) * scaleX;
        const centerCanvasY = (layoutY - rect.top) * scaleY;
        transformRef.current = {
          x: centerCanvasX - newK * graphX,
          y: centerCanvasY - newK * graphY,
          k: newK,
        };
        redraw();
        return;
      }
      const coords = getTouchCoords(e);
      if (!coords) return;
      const start = touchStartRef.current;
      if (start && !panStartRef.current) {
        const dx = coords.clientX - start.clientX;
        const dy = coords.clientY - start.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > TOUCH_PAN_THRESHOLD_PX) {
          panStartRef.current = {
            clientX: start.clientX,
            clientY: start.clientY,
            tx: start.tx,
            ty: start.ty,
          };
          touchStartRef.current = null;
        }
      }
      const panStart = panStartRef.current;
      if (panStart) {
        e.preventDefault();
        transformRef.current.x =
          panStart.tx + (coords.clientX - panStart.clientX);
        transformRef.current.y =
          panStart.ty + (coords.clientY - panStart.clientY);
        redraw();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStartRef.current = null;
      }
      if (e.touches.length === 1) {
        const t = e.touches[0];
        if (t) {
          panStartRef.current = {
            clientX: t.clientX,
            clientY: t.clientY,
            tx: transformRef.current.x,
            ty: transformRef.current.y,
          };
        }
        touchStartRef.current = null;
        redraw();
        return;
      }
      if (e.touches.length > 0) return;
      const start = touchStartRef.current;
      const didPan = panStartRef.current != null;
      if (!didPan && start) {
        if (start.nodeId) {
          onNodeClickRef.current?.(start.nodeId);
        } else if (start.edgeId) {
          onEdgeClickRef.current?.(start.edgeId);
        }
      }
      touchStartRef.current = null;
      panStartRef.current = null;
      redraw();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      ro.disconnect();
      simulationRef.current?.stop();
      simulationRef.current?.on("tick", null);
      simulationRef.current = null;
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [elements, centerNodeId, redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;
    const { width, height } = sizeRef.current;
    if (!canvas || !nodes || !links || width <= 0 || height <= 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const hoveredNode =
      hoveredNodeRef.current ?? draggedNodeRef.current?.id ?? null;
    const hoveredEdge = hoveredEdgeRef.current;
    const selectedEdge = selectedEdgeId ?? null;
    const selectedNode = selectedNodeId?.replace(/^n:/, "") ?? null;
    draw(
      ctx,
      nodes,
      links,
      width,
      height,
      hoveredNode,
      hoveredEdge,
      selectedEdge,
      selectedNode,
      highlightedSet.current,
      transformRef.current
    );

    const el = canvasRef.current;
    if (el) {
      const isPanning = panStartRef.current != null;
      const isPinching = pinchStartRef.current != null;
      if (draggedNodeRef.current || isPanning || isPinching) {
        el.style.cursor = "grabbing";
      } else if (hoveredEdge) {
        el.style.cursor = "pointer";
      } else if (hoveredNode) {
        el.style.cursor = "grab";
      } else {
        el.style.cursor = "grab";
      }
    }
  });

  return (
    <div
      ref={containerRef}
      className={className ?? "absolute inset-0 min-h-0 touch-none"}
      style={{ touchAction: "none" }}
      aria-label="Force-directed graph (drag nodes to reposition)"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none select-none"
        style={{ display: "block", touchAction: "none" }}
      />
      <div
        className="absolute top-3 right-3 z-10 hidden lg:flex flex-col gap-1 rounded-md border border-neutral-700 bg-neutral-900/90 p-1 shadow-md"
        role="group"
        aria-label="Zoom controls"
      >
        <IconButton
          onClick={() => zoomBy(1.25)}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <span className="text-lg font-medium leading-none">+</span>
        </IconButton>
        <IconButton
          onClick={() => zoomBy(0.8)}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <span className="text-lg font-medium leading-none">−</span>
        </IconButton>
      </div>
    </div>
  );
}
