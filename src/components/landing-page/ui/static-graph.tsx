"use client";

import { useEffect, useRef } from "react";

import { staticGraphNodes } from "@/content/landing-page";
import { useIsMobile } from "@/hooks";
import * as d3 from "d3";

// Node size tier 1–5 (1 = smallest, 5 = largest). Used for radius.
const RADIUS_BY_SIZE: Record<number, number> = {
  1: 8,
  2: 10,
  3: 12,
  4: 24,
  5: 28,
};

const { NODES_DATA, LINKS_DATA } = staticGraphNodes;

type D3Node = (typeof NODES_DATA)[0] & {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  /** Rest position after layout. */
  x0?: number;
  y0?: number;
  /** Current waypoint (node floats toward this). */
  tx?: number;
  ty?: number;
  /** Movement speed multiplier (per-node, from hash). */
  floatSpeed?: number;
};
type D3Link = { source: D3Node; target: D3Node };

export const SCALE_FACTOR = 1.5;
export const MOBILE_SCALE_FACTOR = 1.25;
export const ORIGINAL_WIDTH = 700;
export const ORIGINAL_HEIGHT = 400;

/** Alpha below which we consider the layout phase "settled". */
const LAYOUT_ALPHA_MIN = 0.001;

/** Phase 2: how fast position lerps toward waypoint (0–1). */
const FLOAT_LERP = 0.0008;
/** Phase 2: max pixel offset of waypoint from rest (drift radius). */
const DRIFT_RADIUS = 150;
/** Phase 2: when within this distance of waypoint, pick a new one. */
const WAYPOINT_THRESHOLD = 12;

/** Force simulation tuning. */
const LINK_DISTANCE = 80;
const LINK_STRENGTH = 0.75;
const CHARGE_STRENGTH = -280;
const COLLISION_PADDING = 10;

/** Deterministic float in [0, 1) from string (for per-node speed). */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return (Math.abs(h) % 10000) / 10000;
}

/** Phase 2: each node floats toward a waypoint; when close, waypoint jumps to a new random point near rest. Skips node with pinnedNodeId (hovered or dragged). */
function floatStep(
  nodes: D3Node[],
  width: number,
  height: number,
  lerp: number,
  driftRadius: number,
  waypointThreshold: number,
  pinnedNodeId: string | null
) {
  for (const node of nodes) {
    if (pinnedNodeId && node.id === pinnedNodeId) continue;

    const x0 = node.x0 ?? node.x ?? 0;
    const y0 = node.y0 ?? node.y ?? 0;
    let x = node.x ?? 0;
    let y = node.y ?? 0;
    let tx = node.tx ?? x0;
    let ty = node.ty ?? y0;
    const speed = node.floatSpeed ?? 1;

    const dx = tx - x;
    const dy = ty - y;
    const dist = Math.hypot(dx, dy);

    if (dist < waypointThreshold) {
      const angle = Math.random() * 2 * Math.PI;
      const drift = Math.random() * driftRadius;
      tx = x0 + Math.cos(angle) * drift;
      ty = y0 + Math.sin(angle) * drift;
      const pad = RADIUS_BY_SIZE[node.size] ?? 20;
      tx = Math.max(pad, Math.min(width - pad, tx));
      ty = Math.max(pad, Math.min(height - pad, ty));
      node.tx = tx;
      node.ty = ty;
    }

    const t = lerp * speed;
    node.x = x + (tx - x) * t;
    node.y = y + (ty - y) * t;
  }
}

const GRAPH_COLORS = {
  linkStroke: "rgba(95, 95, 95, 1)",
  nodeFill: "rgb(179, 179, 179)",
  nodeStroke: "rgb(179, 179, 179)",
  labelFill: "rgb(246, 246, 246)",
  // Hover state
  nodeFillHover: "rgb(220, 220, 220)",
  nodeStrokeHover: "rgb(255, 255, 255)",
  labelFillHover: "rgb(255, 255, 255)",
  labelFontSizeHoverOffset: 1,
  labelFontWeightHover: "600",
} as const;

/** Keep node positions inside canvas (with padding from radius). */
function clampNodesToBounds(nodes: D3Node[], width: number, height: number) {
  for (const node of nodes) {
    const r = RADIUS_BY_SIZE[node.size] ?? 20;
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    node.x = Math.max(r, Math.min(width - r, x));
    node.y = Math.max(r, Math.min(height - r, y));
  }
}

/** Draw a single node (circle + label). Hover state changes color, label size, and font weight. */
function drawNode(
  ctx: CanvasRenderingContext2D,
  node: D3Node,
  colors: typeof GRAPH_COLORS,
  isHovered: boolean
) {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const r = RADIUS_BY_SIZE[node.size] ?? 20;

  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = isHovered ? colors.nodeFillHover : colors.nodeFill;
  ctx.fill();
  ctx.strokeStyle = isHovered ? colors.nodeStrokeHover : colors.nodeStroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const baseFontSize = node.size >= 4 ? 11 : node.size >= 2 ? 10 : 9;
  const fontSize = isHovered
    ? baseFontSize + colors.labelFontSizeHoverOffset
    : baseFontSize;
  const fontWeight = isHovered
    ? colors.labelFontWeightHover
    : node.size >= 4
      ? "600"
      : "500";
  ctx.font = `${fontWeight} ${fontSize}px system-ui, sans-serif`;
  ctx.fillStyle = isHovered ? colors.labelFillHover : colors.labelFill;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const labelY = y + r + 4;
  ctx.fillText(node.label, x, labelY);
}

function draw(
  ctx: CanvasRenderingContext2D,
  nodes: D3Node[],
  links: D3Link[],
  width: number,
  height: number,
  colors: typeof GRAPH_COLORS,
  hoveredNodeId: string | null
) {
  ctx.clearRect(0, 0, width, height);

  // Links
  ctx.strokeStyle = colors.linkStroke;
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

  // Nodes (via drawNode component)
  for (const node of nodes) {
    drawNode(ctx, node, colors, node.id === hoveredNodeId);
  }
}

/** Find node under canvas coordinates (logical pixels). */
function nodeUnderPoint(
  nodes: D3Node[],
  logicalX: number,
  logicalY: number
): D3Node | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node === undefined) continue;
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const r = RADIUS_BY_SIZE[node.size] ?? 20;
    const dx = logicalX - x;
    const dy = logicalY - y;
    if (dx * dx + dy * dy <= r * r) return node;
  }
  return null;
}

export default function StaticGraph() {
  const isMobile = useIsMobile();
  const WIDTH = isMobile
    ? ORIGINAL_WIDTH * MOBILE_SCALE_FACTOR
    : ORIGINAL_WIDTH * SCALE_FACTOR;
  const HEIGHT = isMobile
    ? ORIGINAL_HEIGHT * MOBILE_SCALE_FACTOR
    : ORIGINAL_HEIGHT * SCALE_FACTOR;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoveredNodeRef = useRef<string | null>(null);
  const draggedNodeRef = useRef<D3Node | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const nodes: D3Node[] = NODES_DATA.map((d) => ({ ...d }));
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const links: D3Link[] = LINKS_DATA.map(({ source, target }) => ({
      source: nodeById.get(source)!,
      target: nodeById.get(target)!,
    }));

    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    canvasEl.width = WIDTH * dpr;
    canvasEl.height = HEIGHT * dpr;
    canvasEl.style.width = `${WIDTH}px`;
    canvasEl.style.height = `${HEIGHT}px`;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const context: CanvasRenderingContext2D = ctx;

    const simulation = d3.forceSimulation(nodes);

    simulation
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => (d as D3Node).id)
          .distance(LINK_DISTANCE)
          .strength(LINK_STRENGTH)
      )
      .force("charge", d3.forceManyBody().strength(CHARGE_STRENGTH))
      .force("center", d3.forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        "collision",
        d3
          .forceCollide<D3Node>()
          .radius((d) => (RADIUS_BY_SIZE[d.size] ?? 20) + COLLISION_PADDING)
      );

    while (simulation.alpha() > LAYOUT_ALPHA_MIN) {
      simulation.tick();
    }

    for (const node of nodes) {
      node.x0 = node.x;
      node.y0 = node.y;
      node.tx = node.x;
      node.ty = node.y;
      node.floatSpeed = 0.5 + hash(node.id);
    }
    simulation.stop();

    function toLogicalCoords(
      el: HTMLCanvasElement,
      e: { clientX: number; clientY: number }
    ) {
      const rect = el.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (draggedNodeRef.current) return;
      const { x, y } = toLogicalCoords(canvasEl, e);
      const node = nodeUnderPoint(nodes, x, y);
      if (node) {
        draggedNodeRef.current = node;
        dragOffsetRef.current = {
          x: x - (node.x ?? 0),
          y: y - (node.y ?? 0),
        };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { x, y } = toLogicalCoords(canvasEl, e);
      const node = draggedNodeRef.current;
      const offset = dragOffsetRef.current;
      if (node && offset) {
        const r = RADIUS_BY_SIZE[node.size] ?? 20;
        const nx = Math.max(r, Math.min(WIDTH - r, x - offset.x));
        const ny = Math.max(r, Math.min(HEIGHT - r, y - offset.y));
        node.x = nx;
        node.y = ny;
        node.x0 = nx;
        node.y0 = ny;
        node.tx = nx;
        node.ty = ny;
      } else {
        const under = nodeUnderPoint(nodes, x, y);
        hoveredNodeRef.current = under?.id ?? null;
      }
    };

    const handleMouseLeave = () => {
      hoveredNodeRef.current = null;
    };

    const handleMouseUp = () => {
      draggedNodeRef.current = null;
      dragOffsetRef.current = null;
    };

    canvasEl.addEventListener("mousedown", handleMouseDown);
    canvasEl.addEventListener("mousemove", handleMouseMove);
    canvasEl.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mouseup", handleMouseUp);

    let rafId: number;
    function loop() {
      const pinnedId =
        hoveredNodeRef.current ?? draggedNodeRef.current?.id ?? null;
      floatStep(
        nodes,
        WIDTH,
        HEIGHT,
        FLOAT_LERP,
        DRIFT_RADIUS,
        WAYPOINT_THRESHOLD,
        pinnedId
      );
      clampNodesToBounds(nodes, WIDTH, HEIGHT);
      const highlightId =
        hoveredNodeRef.current ?? draggedNodeRef.current?.id ?? null;
      draw(context, nodes, links, WIDTH, HEIGHT, GRAPH_COLORS, highlightId);
      const el = canvasRef.current;
      if (el)
        el.style.cursor = draggedNodeRef.current
          ? "grabbing"
          : highlightId
            ? "grab"
            : "default";
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return () => {
      canvasEl.removeEventListener("mousedown", handleMouseDown);
      canvasEl.removeEventListener("mousemove", handleMouseMove);
      canvasEl.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseup", handleMouseUp);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      className="block w-full text-base-content"
      style={{ width: WIDTH, height: HEIGHT }}
      aria-label="Force-directed graph of Web3 conference terms"
    />
  );
}
