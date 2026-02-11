/**
 * Force graph canvas: drawing and hit-testing.
 */

import {
  EDGE_HIT_THRESHOLD,
  GRAPH_COLORS,
  MAX_FROM_HOVERED_EDGE_LABELS,
  MAX_LABEL_WIDTH,
  RADIUS_BY_SIZE,
} from "./force-graph-constants";
import { getConnectedNodeIds } from "./force-graph-data";
import type { ViewLink, ViewNode } from "./force-graph-types";
import {
  darkenColor,
  getEdgeLabel,
  truncateLabel,
} from "./force-graph-utils";

export function drawNode(
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
  ctx.fillStyle = isDimmed
    ? colors.labelFillDimmed
    : active
      ? colors.labelFillHover
      : colors.labelFill;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const displayLabel = active
    ? node.label
    : truncateLabel(ctx, node.label, MAX_LABEL_WIDTH);
  ctx.fillText(displayLabel, x, y + r + 5);
}

export function drawEdgeLabel(
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
  const displayLabel =
    isActive || isFromHoveredNode ? getEdgeLabel(link.label) : "";
  ctx.fillText(displayLabel, mx, my);
}

export function draw(
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
    const isActive =
      link.id === selectedEdgeId ||
      (link.id === hoveredEdgeId && !isHoveringNode);
    const linkConnected =
      isHoveringNode &&
      (connectedNodeIds.has(link.source.id) ||
        connectedNodeIds.has(link.target.id));
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
      const { isActive, edgeDimmed, edgeFromHoveredNode } =
        getLinkState(link);
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

export function edgeUnderPoint(
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

export function nodeUnderPoint(
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

export function getTouchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const a = touches[0];
  const b = touches[1];
  if (!a || !b) return 0;
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

export function getTouchCenter(touches: TouchList): {
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
