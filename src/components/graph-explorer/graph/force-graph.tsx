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

import { NODE_COLOR_DEFAULTS } from "@/lib/utils/graph-theme";
import type { GraphElement } from "@/lib/utils/sigma-adapter";

import { IconButton } from "../ui/icon-button";

// Obsidian-style: smaller, denser nodes
const RADIUS_BY_SIZE: Record<number, number> = {
  1: 4,
  2: 5,
  3: 6,
  4: 10,
  5: 14,
};

const LAYOUT_ALPHA_MIN = 0.0005;
const LINK_DISTANCE = 100;
const LINK_STRENGTH = 0.5;
const CHARGE_STRENGTH = -240;
const COLLISION_PADDING = 18;
const CENTER_STRENGTH = 0.12;
const ALPHA_DECAY = 0.018;
const VELOCITY_DECAY = 0.65;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
const GRAPH_WIDTH = 3200;
const GRAPH_HEIGHT = 2400;
const MAX_LABEL_WIDTH = 80;

const MAX_FROM_HOVERED_EDGE_LABELS = 15;

const GRAPH_COLORS = {
  linkStroke: "rgba(95, 95, 95, 0.85)",
  linkStrokeDimmed: "rgb(50, 50, 50)",
  linkStrokeActive: "rgba(255, 255, 255, 0.9)",
  linkLabelFill: "rgb(200, 200, 200)",
  linkLabelFillDimmed: "rgb(90, 90, 90)",
  linkLabelFillActive: "rgb(255, 255, 255)",
  nodeFill: "rgb(179, 179, 179)",
  nodeStroke: "rgb(179, 179, 179)",
  labelFill: "rgb(246, 246, 246)",
  labelFillDimmed: "rgb(85, 85, 85)",
  nodeFillHover: "rgb(220, 220, 220)",
  nodeStrokeHover: "rgb(255, 255, 255)",
  labelFillHover: "rgb(255, 255, 255)",
  labelFontSizeHoverOffset: 1,
  labelFontWeightHover: "600",
  nodeFillSelected: "rgb(220, 220, 220)",
  nodeStrokeSelected: "rgb(255, 255, 255)",
} as const;

const EDGE_LABEL_MAX_WIDTH = 64;
const EDGE_HIT_THRESHOLD = 6;
/** Factor to darken node fill/stroke when dimmed (multiply RGB by this) */
const DIM_DARKEN_FACTOR = 0.4;

/** Returns a darker rgb string from a color (hex or rgb(r,g,b)) */
function darkenColor(color: string, factor: number = DIM_DARKEN_FACTOR): string {
  let r = 0,
    g = 0,
    b = 0;
  const hexMatch = color.match(/^#?([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})$/);
  if (hexMatch) {
    r = parseInt(hexMatch[1] ?? "0", 16);
    g = parseInt(hexMatch[2] ?? "0", 16);
    b = parseInt(hexMatch[3] ?? "0", 16);
  } else {
    const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
      r = parseInt(rgbMatch[1] ?? "0", 10);
      g = parseInt(rgbMatch[2] ?? "0", 10);
      b = parseInt(rgbMatch[3] ?? "0", 10);
    } else {
      return "rgb(60, 60, 60)";
    }
  }
  r = Math.round(r * factor);
  g = Math.round(g * factor);
  b = Math.round(b * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

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

// Convert snake case to title case
function getEdgeLabel(edgeLabel: string): string {
  const lowerCaseLabel = edgeLabel.toLowerCase();
  const sentenceCaseLabel = lowerCaseLabel.replace(/_/g, " ");
  return sentenceCaseLabel;
}

/** Entity-based node color (aligned with SigmaGraph / graph-theme) */
const NODE_TYPE_COLORS = {
  episode: NODE_COLOR_DEFAULTS.episodeColor,
  entity: NODE_COLOR_DEFAULTS.entityColor,
  user: NODE_COLOR_DEFAULTS.userColor,
  unknown: NODE_COLOR_DEFAULTS.unknownColor,
} as const;

function getNodeColor(
  nodeType: string | undefined,
  labels: string[] | undefined
): string {
  const hasUserLabel =
    labels?.some(
      (lbl) => typeof lbl === "string" && lbl.toLowerCase() === "user"
    ) ?? false;
  if (hasUserLabel) return NODE_TYPE_COLORS.user;
  const type = (nodeType ?? "entity").toLowerCase();
  if (type === "episode") return NODE_TYPE_COLORS.episode;
  if (type === "entity") return NODE_TYPE_COLORS.entity;
  return NODE_TYPE_COLORS.unknown;
}

interface ViewNode {
  id: string;
  label: string;
  size: number;
  /** Fill color by entity type (episode / entity / user / unknown) */
  color: string;
  x?: number;
  y?: number;
  x0?: number;
  y0?: number;
  /** Fixed position while dragging (d3 force) */
  fx?: number;
  fy?: number;
}
interface ViewLink {
  source: ViewNode;
  target: ViewNode;
  id: string;
  label: string;
}

function elementsToView(elements: GraphElement[]): {
  nodes: ViewNode[];
  links: { source: string; target: string; id: string; label: string }[];
} {
  const nodeById = new Map<string, ViewNode>();

  const nodeElements: GraphElement[] = [];
  const edgeElements: GraphElement[] = [];
  for (const el of elements) {
    const data = el?.data ?? {};
    if (
      data &&
      "source" in data &&
      "target" in data &&
      data.source != null &&
      data.target != null
    ) {
      edgeElements.push(el);
    } else {
      nodeElements.push(el);
    }
  }

  for (const el of nodeElements) {
    const data = el?.data ?? {};
    const rawId = String(data.id ?? "").replace(/^n:/, "");
    if (!rawId) continue;
    const label = String(
      data.labelFull ?? data.label ?? data.labelShort ?? data.name ?? rawId
    );
    const type = (data.node_type ?? "entity") as string;
    const size = String(type).toLowerCase().includes("episode") ? 4 : 3;
    const color = getNodeColor(
      data.node_type,
      data.labels as string[] | undefined
    );
    nodeById.set(rawId, { id: rawId, label, size, color });
  }

  const usedEdgeIds = new Map<string, number>();
  const links: { source: string; target: string; id: string; label: string }[] =
    [];
  for (const el of edgeElements) {
    const data = el?.data ?? {};
    const source = String(data.source ?? "").replace(/^n:/, "");
    const target = String(data.target ?? "").replace(/^n:/, "");
    if (!source || !target || !nodeById.has(source) || !nodeById.has(target))
      continue;
    const baseId = String(data.id ?? `${data.source}->${data.target}`);
    const seen = usedEdgeIds.get(baseId) ?? 0;
    const id = seen === 0 ? baseId : `${baseId}__dup_${seen + 1}`;
    usedEdgeIds.set(baseId, seen + 1);
    const label = String(data.label ?? data.relationship ?? "");
    links.push({ source, target, id, label });
  }

  return { nodes: Array.from(nodeById.values()), links };
}

function clampNodesToBounds(
  nodes: ViewNode[],
  width: number,
  height: number
): void {
  for (const node of nodes) {
    const r = RADIUS_BY_SIZE[node.size] ?? 12;
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    node.x = Math.max(r, Math.min(width - r, x));
    node.y = Math.max(r, Math.min(height - r, y));
  }
}

/** Set of node IDs that are the hovered node plus all nodes connected to it by an edge */
function getConnectedNodeIds(
  hoveredNodeId: string | null,
  links: ViewLink[]
): Set<string> {
  if (!hoveredNodeId) return new Set();
  const set = new Set<string>([hoveredNodeId]);
  for (const link of links) {
    const sid = link.source.id;
    const tid = link.target.id;
    if (sid === hoveredNodeId || tid === hoveredNodeId) {
      set.add(sid);
      set.add(tid);
    }
  }
  return set;
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: ViewNode,
  colors: typeof GRAPH_COLORS,
  isHovered: boolean,
  isSelectedOrHighlighted: boolean,
  isDimmed: boolean
): void {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const r = RADIUS_BY_SIZE[node.size] ?? 12;
  const active = isHovered || isSelectedOrHighlighted;

  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  const baseFill = node.color ?? colors.nodeFill;
  const baseStroke = node.color ?? colors.nodeStroke;
  const fillColor = isDimmed
    ? darkenColor(baseFill)
    : active
      ? isSelectedOrHighlighted
        ? colors.nodeFillSelected
        : colors.nodeFillHover
      : baseFill;
  const strokeColor = isDimmed
    ? darkenColor(baseStroke)
    : active
      ? isSelectedOrHighlighted
        ? colors.nodeStrokeSelected
        : colors.nodeStrokeHover
      : baseStroke;
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = active ? 2 : 1.2;
  ctx.stroke();

  const baseFontSize = node.size >= 4 ? 10 : node.size >= 2 ? 9 : 8;
  const fontSize = active
    ? baseFontSize + GRAPH_COLORS.labelFontSizeHoverOffset
    : baseFontSize;
  const fontWeight = active
    ? GRAPH_COLORS.labelFontWeightHover
    : node.size >= 4
      ? "600"
      : "500";
  ctx.font = `${fontWeight} ${fontSize}px system-ui, sans-serif`;
  ctx.fillStyle = isDimmed ? colors.labelFillDimmed : active ? colors.labelFillHover : colors.labelFill;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const displayLabel = active
    ? node.label
    : truncateLabel(ctx, node.label, MAX_LABEL_WIDTH);
  ctx.fillText(displayLabel, x, y + r + 5);
}

function drawEdgeLabel(
  ctx: CanvasRenderingContext2D,
  link: ViewLink,
  isActive: boolean,
  isFromHoveredNode: boolean,
  isDimmed: boolean,
  colors: typeof GRAPH_COLORS
): void {
  const sx = link.source.x ?? 0;
  const sy = link.source.y ?? 0;
  const tx = link.target.x ?? 0;
  const ty = link.target.y ?? 0;
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  if (!link.label) return;
  const showLabel = isActive || isFromHoveredNode;
  const fontSize = showLabel ? 9 : 8;
  const fontWeight = showLabel ? "600" : "500";
  ctx.font = `italic ${fontWeight} ${fontSize}px system-ui, sans-serif`;
  ctx.fillStyle = isDimmed
    ? colors.linkLabelFillDimmed
    : isActive || isFromHoveredNode
      ? colors.linkLabelFillActive
      : colors.linkLabelFill;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Show label for active edge or for any edge connected to hovered node
  const displayLabel =
    isActive || isFromHoveredNode ? getEdgeLabel(link.label) : "";
  ctx.fillText(displayLabel, mx, my);
}

function draw(
  ctx: CanvasRenderingContext2D,
  nodes: ViewNode[],
  links: ViewLink[],
  width: number,
  height: number,
  hoveredNodeId: string | null,
  hoveredEdgeId: string | null,
  selectedEdgeId: string | null,
  highlightedNodeIds: Set<string>,
  transform: { x: number; y: number; k: number }
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  const connectedNodeIds = getConnectedNodeIds(hoveredNodeId, links);
  const isHoveringNode = hoveredNodeId != null;

  const getLinkState = (link: ViewLink) => {
    // When a node is hovered, do not highlight a single edge under cursor — only selected edge
    const isActive =
      link.id === selectedEdgeId ||
      (link.id === hoveredEdgeId && !isHoveringNode);
    const linkConnected =
      isHoveringNode &&
      (connectedNodeIds.has(link.source.id) || connectedNodeIds.has(link.target.id));
    const edgeDimmed = isHoveringNode && !linkConnected;
    const edgeFromHoveredNode =
      isHoveringNode &&
      (link.source.id === hoveredNodeId || link.target.id === hoveredNodeId);
    return { isActive, edgeDimmed, edgeFromHoveredNode };
  };

  // —— Layer 1: dimmed edges (below everything)
  for (const link of links) {
    const { isActive, edgeDimmed } = getLinkState(link);
    if (!edgeDimmed || isActive) continue;
    const sx = link.source.x ?? 0;
    const sy = link.source.y ?? 0;
    const tx = link.target.x ?? 0;
    const ty = link.target.y ?? 0;
    ctx.strokeStyle = GRAPH_COLORS.linkStrokeDimmed;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }
  // —— Layer 2: dimmed edge labels
  for (const link of links) {
    const { isActive, edgeDimmed } = getLinkState(link);
    if (!edgeDimmed || isActive) continue;
    drawEdgeLabel(ctx, link, false, false, true, GRAPH_COLORS);
  }
  // —— Layer 3: dimmed nodes
  for (const node of nodes) {
    const isDimmed = isHoveringNode && !connectedNodeIds.has(node.id);
    if (!isDimmed) continue;
    drawNode(ctx, node, GRAPH_COLORS, false, false, true);
  }

  // —— Layer 4: normal (connected, not from-hovered) edges
  for (const link of links) {
    const { isActive, edgeDimmed, edgeFromHoveredNode } = getLinkState(link);
    if (edgeDimmed || edgeFromHoveredNode || isActive) continue;
    const sx = link.source.x ?? 0;
    const sy = link.source.y ?? 0;
    const tx = link.target.x ?? 0;
    const ty = link.target.y ?? 0;
    ctx.strokeStyle = GRAPH_COLORS.linkStroke;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }
  // —— Layer 5: edges from hovered node (highlighted)
  for (const link of links) {
    const { isActive, edgeFromHoveredNode } = getLinkState(link);
    if (!edgeFromHoveredNode || isActive) continue;
    const sx = link.source.x ?? 0;
    const sy = link.source.y ?? 0;
    const tx = link.target.x ?? 0;
    const ty = link.target.y ?? 0;
    ctx.strokeStyle = GRAPH_COLORS.linkStrokeActive;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }
  // —— Layer 6: active edge (hovered/selected)
  for (const link of links) {
    const { isActive } = getLinkState(link);
    if (!isActive) continue;
    const sx = link.source.x ?? 0;
    const sy = link.source.y ?? 0;
    const tx = link.target.x ?? 0;
    const ty = link.target.y ?? 0;
    ctx.strokeStyle = GRAPH_COLORS.linkStrokeActive;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }

  // —— Layer 7: normal edge labels
  links
    .filter((link) => {
      const { isActive, edgeDimmed, edgeFromHoveredNode } = getLinkState(link);
      return !edgeDimmed && !edgeFromHoveredNode && !isActive;
    })
    .forEach((link) =>
      drawEdgeLabel(ctx, link, false, false, false, GRAPH_COLORS)
    );

  // —— Layer 8: from-hovered edge labels (only if ≤ MAX_FROM_HOVERED_EDGE_LABELS)
  const fromHoveredLinks = links.filter((link) => {
    const { isActive, edgeFromHoveredNode } = getLinkState(link);
    return edgeFromHoveredNode && !isActive;
  });
  if (fromHoveredLinks.length <= MAX_FROM_HOVERED_EDGE_LABELS) {
    fromHoveredLinks.forEach((link) =>
      drawEdgeLabel(ctx, link, false, true, false, GRAPH_COLORS)
    );
  }

  // —— Layer 9: active edge label
  links
    .filter((link) => getLinkState(link).isActive)
    .forEach((link) =>
      drawEdgeLabel(ctx, link, true, false, false, GRAPH_COLORS)
    );

  // —— Layer 10: non-dimmed nodes (on top)
  for (const node of nodes) {
    const isDimmed = isHoveringNode && !connectedNodeIds.has(node.id);
    if (isDimmed) continue;
    const isHighlighted = highlightedNodeIds.has(node.id);
    drawNode(
      ctx,
      node,
      GRAPH_COLORS,
      node.id === hoveredNodeId,
      isHighlighted,
      false
    );
  }
  ctx.restore();
}

/** Distance from point (px, py) to line segment (ax,ay)-(bx,by) in graph coords */
function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const ab2 = abx * abx + aby * aby;
  let t = ab2 <= 0 ? 0 : (apx * abx + apy * aby) / ab2;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + t * abx;
  const qy = ay + t * aby;
  const dx = px - qx;
  const dy = py - qy;
  return Math.sqrt(dx * dx + dy * dy);
}

function edgeUnderPoint(
  links: ViewLink[],
  x: number,
  y: number
): ViewLink | null {
  let best: { link: ViewLink; d: number } | null = null;
  for (const link of links) {
    const sx = link.source.x ?? 0;
    const sy = link.source.y ?? 0;
    const tx = link.target.x ?? 0;
    const ty = link.target.y ?? 0;
    const d = distanceToSegment(x, y, sx, sy, tx, ty);
    if (d <= EDGE_HIT_THRESHOLD && (!best || d < best.d)) {
      best = { link, d };
    }
  }
  return best?.link ?? null;
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
    const r = RADIUS_BY_SIZE[node.size] ?? 12;
    const dx = x - nx;
    const dy = y - ny;
    if (dx * dx + dy * dy <= r * r) return node;
  }
  return null;
}

function getTouchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const a = touches[0];
  const b = touches[1];
  if (!a || !b) return 0;
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function getTouchCenter(touches: TouchList): {
  clientX: number;
  clientY: number;
} {
  if (touches.length < 2) return { clientX: 0, clientY: 0 };
  const a = touches[0];
  const b = touches[1];
  if (!a || !b) return { clientX: 0, clientY: 0 };
  return {
    clientX: (a.clientX + b.clientX) / 2,
    clientY: (a.clientY + b.clientY) / 2,
  };
}

export interface ForceGraphProps {
  /** Graph elements (nodes + edges) from GraphExplorer */
  elements: GraphElement[];
  /** Called when a node is clicked (no drag) */
  onNodeClick?: (nodeId: string) => void;
  /** Called when an edge is clicked */
  onEdgeClick?: (edgeId: string) => void;
  /** Currently selected node ID (displayed as highlighted) */
  selectedNodeId?: string | null;
  /** Currently selected edge ID (displayed as highlighted, opens wiki panel) */
  selectedEdgeId?: string | null;
  /** Node IDs to highlight */
  highlightedNodeIds?: string[];
  /** Center node ID: when set, the view is panned so this node is at the viewport center on load */
  centerNodeId?: string | null;
  /** One-shot: when set, pan the view so this node is at center (no graph update). Cleared via onPanToNodeComplete */
  panToNodeId?: string | null;
  /** Called after panning to panToNodeId so the parent can clear it */
  onPanToNodeComplete?: () => void;
  /** Additional CSS class */
  className?: string;
}

export default function ForceGraph({
  elements,
  onNodeClick,
  onEdgeClick,
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
  const lastLogicalRef = useRef({ x: 0, y: 0 });
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
  onNodeClickRef.current = onNodeClick;
  onEdgeClickRef.current = onEdgeClick;

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

    // Stop any previous simulation so we can create a new one
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
        const simulation = d3.forceSimulation(nodes)
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
      draw(
        ctx,
        nodes,
        links,
        width,
        height,
        null,
        null,
        null,
        highlightedSet.current,
        transformRef.current
      );
    };

    resize(true);
    const ro = new ResizeObserver(() => resize(false));
    ro.observe(container);

    // Normalize client coords to layout viewport (fixes tap offset on mobile when
    // touch events are in visual viewport but getBoundingClientRect is layout).
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
        // Do not fix node or restart simulation here — only when user actually drags (see handleMouseMove)
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
        // Start drag only after pointer moves past a small threshold so click-without-drag doesn't run simulation
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
      const node = draggedNodeRef.current;
      if (node && !didDragRef.current) {
        onNodeClickRef.current?.(node.id);
      } else if (!didDragRef.current && linksRef.current) {
        const { x, y } = lastLogicalRef.current;
        const edgeUnder = edgeUnderPoint(linksRef.current, x, y);
        if (edgeUnder) {
          onEdgeClickRef.current?.(edgeUnder.id);
        }
      }
      if (node && didDragRef.current) {
        // Pin node at dropped position so it stays there (no spring-back)
        node.fx = node.x;
        node.fy = node.y;
        // Don't restart simulation — layout stays as is
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
        // Start pinch zoom
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
      e.preventDefault(); // claim touch so browser doesn't scroll/zoom; enables reliable pan + tap
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
      // Two-finger pinch zoom
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
          touchStartRef.current = null; // only clear when we commit to pan, so tap still fires if no pan
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
      // Two fingers -> one or zero: clear pinch so next gesture is pan/tap
      if (e.touches.length < 2) {
        pinchStartRef.current = null;
      }
      // When going from 2 to 1 finger, treat remaining touch as pan start so user can pan without re-touching
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

  // Redraw when tick or highlighted set changes
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
    draw(
      ctx,
      nodes,
      links,
      width,
      height,
      hoveredNode,
      hoveredEdge,
      selectedEdge,
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
