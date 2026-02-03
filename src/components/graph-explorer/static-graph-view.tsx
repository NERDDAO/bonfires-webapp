"use client";

/**
 * StaticGraphView
 *
 * Renders the actual graph (nodes + edges from API) with the same visual style
 * as the static-graph design: canvas, node size by type, drag-only interactions.
 * No animations. Uses d3 force for initial layout once, then nodes stay fixed until dragged.
 */

import type { GraphData } from "@/types/graph";
import * as d3 from "d3";
import { useCallback, useEffect, useRef, useState } from "react";

const RADIUS_BY_SIZE: Record<number, number> = {
  1: 8,
  2: 10,
  3: 12,
  4: 24,
  5: 28,
};

const LAYOUT_ALPHA_MIN = 0.001;
const LINK_DISTANCE = 80;
const LINK_STRENGTH = 0.75;
const CHARGE_STRENGTH = -280;
const COLLISION_PADDING = 10;
const CENTER_STRENGTH = 0.08; // pull each node toward center so unconnected nodes don't fly off
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
/** Virtual graph dimensions – simulation runs in this space so many nodes aren't squashed at edges */
const GRAPH_WIDTH = 3200;
const GRAPH_HEIGHT = 2400;

const MAX_LABEL_WIDTH = 72; // truncate label when not hovered

const GRAPH_COLORS = {
  linkStroke: "rgba(95, 95, 95, 1)",
  nodeFill: "rgb(179, 179, 179)",
  nodeStroke: "rgb(179, 179, 179)",
  labelFill: "rgb(246, 246, 246)",
  nodeFillHover: "rgb(220, 220, 220)",
  nodeStrokeHover: "rgb(255, 255, 255)",
  labelFillHover: "rgb(255, 255, 255)",
  labelFontSizeHoverOffset: 1,
  labelFontWeightHover: "600",
} as const;

function truncateLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  maxWidth: number
): string {
  if (ctx.measureText(label).width <= maxWidth) return label;
  const ellipsis = "…";
  let s = label;
  while (s.length > 0 && ctx.measureText(s + ellipsis).width > maxWidth) {
    s = s.slice(0, -1);
  }
  return s + ellipsis;
}

interface ViewNode {
  id: string;
  label: string;
  size: number;
  x?: number;
  y?: number;
  x0?: number;
  y0?: number;
}
type D3Link = { source: ViewNode; target: ViewNode };

function graphDataToView(graphData: GraphData): {
  nodes: ViewNode[];
  links: { source: string; target: string }[];
} {
  const nodeById = new Map<string, ViewNode>();
  for (const node of graphData.nodes) {
    const raw = node as Record<string, unknown>;
    const id = String(raw["uuid"] ?? raw["id"] ?? "").replace(/^n:/, "");
    if (!id) continue;
    const label = String(
      raw["name"] ?? raw["label"] ?? raw["title"] ?? raw["summary"] ?? id
    );
    const type = (raw["type"] ?? raw["node_type"] ?? "entity") as string;
    const size = String(type).toLowerCase().includes("episode") ? 4 : 3;
    nodeById.set(id, { id, label, size });
  }

  const links: { source: string; target: string }[] = [];
  for (const edge of graphData.edges) {
    const raw = edge as Record<string, unknown>;
    const source = String(
      raw["source"] ??
        raw["source_uuid"] ??
        raw["from_uuid"] ??
        raw["from"] ??
        ""
    ).replace(/^n:/, "");
    const target = String(
      raw["target"] ??
        raw["target_uuid"] ??
        raw["to_uuid"] ??
        raw["to"] ??
        ""
    ).replace(/^n:/, "");
    if (source && target && nodeById.has(source) && nodeById.has(target)) {
      links.push({ source, target });
    }
  }

  return { nodes: Array.from(nodeById.values()), links };
}

function clampNodesToBounds(
  nodes: ViewNode[],
  width: number,
  height: number
): void {
  for (const node of nodes) {
    const r = RADIUS_BY_SIZE[node.size] ?? 20;
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    node.x = Math.max(r, Math.min(width - r, x));
    node.y = Math.max(r, Math.min(height - r, y));
  }
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: ViewNode,
  colors: typeof GRAPH_COLORS,
  isHovered: boolean
): void {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const r = RADIUS_BY_SIZE[node.size] ?? 20;

  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = isHovered ? colors.nodeFillHover : colors.nodeFill;
  ctx.fill();
  ctx.strokeStyle = isHovered ? colors.nodeStrokeHover : colors.nodeStroke;
  ctx.lineWidth = isHovered ? 2.5 : 1.5;
  ctx.stroke();

  const baseFontSize = node.size >= 4 ? 11 : node.size >= 2 ? 10 : 9;
  const fontSize = isHovered
    ? baseFontSize + GRAPH_COLORS.labelFontSizeHoverOffset
    : baseFontSize;
  const fontWeight = isHovered
    ? GRAPH_COLORS.labelFontWeightHover
    : node.size >= 4
      ? "600"
      : "500";
  ctx.font = `${fontWeight} ${fontSize}px system-ui, sans-serif`;
  ctx.fillStyle = isHovered ? colors.labelFillHover : colors.labelFill;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const displayLabel = isHovered
    ? node.label
    : truncateLabel(ctx, node.label, MAX_LABEL_WIDTH);
  ctx.fillText(displayLabel, x, y + r + 4);
}

function draw(
  ctx: CanvasRenderingContext2D,
  nodes: ViewNode[],
  links: D3Link[],
  width: number,
  height: number,
  hoveredNodeId: string | null,
  transform: { x: number; y: number; k: number }
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  ctx.strokeStyle = GRAPH_COLORS.linkStroke;
  ctx.lineWidth = 1.5;
  for (const link of links) {
    const sx = link.source.x ?? 0;
    const sy = link.source.y ?? 0;
    const tx = link.target.x ?? 0;
    const ty = link.target.y ?? 0;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }

  for (const node of nodes) {
    drawNode(ctx, node, GRAPH_COLORS, node.id === hoveredNodeId);
  }
  ctx.restore();
}

function nodeUnderPoint(
  nodes: ViewNode[],
  x: number,
  y: number
): ViewNode | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node === undefined) continue;
    const nx = node.x ?? 0;
    const ny = node.y ?? 0;
    const r = RADIUS_BY_SIZE[node.size] ?? 20;
    const dx = x - nx;
    const dy = y - ny;
    if (dx * dx + dy * dy <= r * r) return node;
  }
  return null;
}

interface StaticGraphViewProps {
  /** Graph data from API (nodes + edges). Same shape as GraphExplorer. */
  graphData: GraphData | null;
}

export default function StaticGraphView({ graphData }: StaticGraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<ViewNode[] | null>(null);
  const linksRef = useRef<D3Link[] | null>(null);
  const hoveredNodeRef = useRef<string | null>(null);
  const draggedNodeRef = useRef<ViewNode | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const sizeRef = useRef({ width: 0, height: 0 });
  const graphSizeRef = useRef({ graphWidth: GRAPH_WIDTH, graphHeight: GRAPH_HEIGHT });
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const panStartRef = useRef<{ clientX: number; clientY: number; tx: number; ty: number } | null>(null);
  const [, setTick] = useState(0);

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

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !graphData) {
      nodesRef.current = null;
      linksRef.current = null;
      return;
    }

    const { nodes: viewNodes, links: viewLinks } = graphDataToView(graphData);
    const nodes: ViewNode[] = viewNodes.map((n) => ({ ...n }));
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const links: D3Link[] = viewLinks
      .map(({ source, target }) => {
        const src = nodeById.get(source);
        const tgt = nodeById.get(target);
        if (!src || !tgt) return null;
        return { source: src, target: tgt };
      })
      .filter((l): l is D3Link => l != null);
    nodesRef.current = nodes;
    linksRef.current = links;

    const resize = () => {
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

      const simulation = d3.forceSimulation(nodes);
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
            .radius((d) => (RADIUS_BY_SIZE[d.size] ?? 20) + COLLISION_PADDING)
        );

      while (simulation.alpha() > LAYOUT_ALPHA_MIN) {
        simulation.tick();
      }
      simulation.stop();

      clampNodesToBounds(nodes, graphWidth, graphHeight);
      for (const node of nodes) {
        node.x0 = node.x;
        node.y0 = node.y;
      }

      sizeRef.current = { width, height };
      transformRef.current = {
        x: width / 2 - graphWidth / 2,
        y: height / 2 - graphHeight / 2,
        k: 1,
      };
      draw(ctx, nodes, links, width, height, null, transformRef.current);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const toLogical = (
      e: { clientX: number; clientY: number }
    ): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = (canvas.width / (window.devicePixelRatio ?? 1)) / rect.width;
      const scaleY =
        (canvas.height / (window.devicePixelRatio ?? 1)) / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;
      const t = transformRef.current;
      return {
        x: (canvasX - t.x) / t.k,
        y: (canvasY - t.y) / t.k,
      };
    };

    const getSize = () => ({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    const handleMouseDown = (e: MouseEvent) => {
      if (draggedNodeRef.current || panStartRef.current) return;
      const { x, y } = toLogical(e);
      const node = nodeUnderPoint(nodes, x, y);
      if (node) {
        draggedNodeRef.current = node;
        didDragRef.current = false;
        dragOffsetRef.current = {
          x: x - (node.x ?? 0),
          y: y - (node.y ?? 0),
        };
      } else {
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
        didDragRef.current = true;
        const r = RADIUS_BY_SIZE[node.size] ?? 20;
        const nx = Math.max(r, Math.min(graphWidth - r, x - offset.x));
        const ny = Math.max(r, Math.min(graphHeight - r, y - offset.y));
        node.x = nx;
        node.y = ny;
        node.x0 = nx;
        node.y0 = ny;
        redraw();
      } else {
        const under = nodeUnderPoint(nodes, x, y);
        hoveredNodeRef.current = under?.id ?? null;
        redraw();
      }
    };

    const handleMouseLeave = () => {
      hoveredNodeRef.current = null;
      redraw();
    };

    const handleMouseUp = () => {
      const node = draggedNodeRef.current;
      if (node && !didDragRef.current) {
        console.log("Node clicked:", {
          id: node.id,
          label: node.label,
          size: node.size,
          x: node.x,
          y: node.y,
        });
      }
      draggedNodeRef.current = null;
      dragOffsetRef.current = null;
      panStartRef.current = null;
      didDragRef.current = false;
      redraw();
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = (canvas.width / (window.devicePixelRatio ?? 1)) / rect.width;
      const scaleY =
        (canvas.height / (window.devicePixelRatio ?? 1)) / rect.height;
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

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      ro.disconnect();
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [graphData, redraw]);

  // Redraw when tick changes (after drag/hover)
  useEffect(() => {
    const canvas = canvasRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;
    const { width, height } = sizeRef.current;
    if (!canvas || !nodes || !links || width <= 0 || height <= 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const hovered =
      hoveredNodeRef.current ?? draggedNodeRef.current?.id ?? null;
    draw(ctx, nodes, links, width, height, hovered, transformRef.current);

    const el = canvasRef.current;
    if (el) {
      const isPanning = panStartRef.current != null;
      el.style.cursor =
        draggedNodeRef.current || isPanning
          ? "grabbing"
          : hovered
            ? "grab"
            : "grab";
    }
  });

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 min-h-0"
      aria-label="Force-directed graph (drag nodes to reposition)"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ display: "block" }}
      />
      <div
        className="absolute top-3 right-3 z-10 flex flex-col gap-1 rounded-md border border-neutral-700 bg-neutral-900/90 p-1 shadow-md"
        role="group"
        aria-label="Zoom controls"
      >
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded border-0 bg-transparent text-neutral-200 transition hover:bg-neutral-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
        >
          <span className="text-lg font-medium leading-none">+</span>
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.8)}
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded border-0 bg-transparent text-neutral-200 transition hover:bg-neutral-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
        >
          <span className="text-lg font-medium leading-none">−</span>
        </button>
      </div>
    </div>
  );
}
