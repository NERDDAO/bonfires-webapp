/**
 * Force graph canvas: drawing and hit-testing.
 */

import {
  EDGE_HIT_THRESHOLD,
  EDGE_LABEL_OFFSET,
  EDGE_WIDTH_ACTIVE,
  EDGE_WIDTH_DIMMED,
  EDGE_WIDTH_NORMAL,
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
  // Align label with edge direction: rotate and place at midpoint with perpendicular offset
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.hypot(dx, dy) || 1;
  let angle = Math.atan2(dy, dx);
  if (angle > Math.PI / 2) angle -= Math.PI;
  else if (angle < -Math.PI / 2) angle += Math.PI;
  const perpX = (-dy / len) * EDGE_LABEL_OFFSET;
  const perpY = (dx / len) * EDGE_LABEL_OFFSET;
  const labelX = mx + perpX;
  const labelY = my + perpY;
  ctx.save();
  ctx.translate(labelX, labelY);
  ctx.rotate(angle);
  ctx.fillText(displayLabel, 0, 0);
  ctx.restore();
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
  selectedNodeId: string | null,
  highlightedNodeIds: Set<string>,
  transform: { x: number; y: number; k: number }
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  const isHoveringNode = hoveredNodeId != null;
  // Focus node for dimming: hover (immediate) or selection (persists when mouse moves)
  const focusNodeId = hoveredNodeId ?? selectedNodeId;
  const hasNodeFocus = focusNodeId != null;
  const activeEdgeId =
    selectedEdgeId ?? (isHoveringNode ? null : hoveredEdgeId);
  const hasEdgeFocus = activeEdgeId != null;
  const activeLink = hasEdgeFocus
    ? links.find((l) => l.id === activeEdgeId) ?? null
    : null;

  // When a node has focus (hover or selected): connected = that node + neighbors. When only an edge is active: connected = its two endpoints.
  // Give node focus precedence so hovering a node still highlights it even when an edge is selected.
  let connectedNodeIds = hasNodeFocus
    ? getConnectedNodeIds(focusNodeId, links)
    : hasEdgeFocus && activeLink
      ? new Set<string>([activeLink.source.id, activeLink.target.id])
      : new Set<string>();
  const hasSelection = selectedNodeId != null || selectedEdgeId != null;
  // When there is a selection and an edge is hovered, include the hovered edge's endpoints so they are not dimmed.
  if (hasSelection && hoveredEdgeId) {
    const hoveredLink = links.find((l) => l.id === hoveredEdgeId);
    if (hoveredLink) {
      connectedNodeIds = new Set(connectedNodeIds);
      connectedNodeIds.add(hoveredLink.source.id);
      connectedNodeIds.add(hoveredLink.target.id);
    }
  }
  const hasFocus = hasNodeFocus || hasEdgeFocus;

  const getLinkState = (link: ViewLink) => {
    const isActive =
      link.id === selectedEdgeId ||
      (link.id === hoveredEdgeId && !isHoveringNode);
    const linkConnected =
      hasFocus &&
      (connectedNodeIds.has(link.source.id) ||
        connectedNodeIds.has(link.target.id) ||
        (hasSelection && link.id === hoveredEdgeId));
    const edgeDimmed = hasFocus && !linkConnected;
    const edgeFromHoveredNode =
      isHoveringNode &&
      (link.source.id === hoveredNodeId || link.target.id === hoveredNodeId);
    // Treat edges from selected node like "from hovered" when node has focus (so style/labels persist)
    const edgeFromFocusNode =
      hasNodeFocus &&
      !isHoveringNode &&
      (link.source.id === focusNodeId || link.target.id === focusNodeId);
    // When an edge is hovered (and no selection), highlight only that edge. When there is a selection, keep showing selection's connections and also highlight the hovered edge.
    const edgeHoverTakesPrecedence =
      hoveredEdgeId != null &&
      activeEdgeId === hoveredEdgeId &&
      !hasSelection;
    const edgeFromFocusedNode =
      !edgeHoverTakesPrecedence && (edgeFromHoveredNode || edgeFromFocusNode);
    return { isActive, edgeDimmed, edgeFromHoveredNode: edgeFromFocusedNode };
  };

  // —— 1. Dimmed edges
  for (const link of links) {
    const { isActive, edgeDimmed } = getLinkState(link);
    if (!edgeDimmed || isActive) continue;
    const sx = link.source.x ?? 0;
    const sy = link.source.y ?? 0;
    const tx = link.target.x ?? 0;
    const ty = link.target.y ?? 0;
    ctx.strokeStyle = GRAPH_COLORS.linkStrokeDimmed;
    ctx.lineWidth = EDGE_WIDTH_DIMMED;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }
  // —— 2. Dimmed nodes (circles + node labels)
  for (const node of nodes) {
    const isDimmed = hasFocus && !connectedNodeIds.has(node.id);
    if (!isDimmed) continue;
    drawNode(ctx, node, GRAPH_COLORS, false, false, true);
  }
  // —— 3. Dimmed edge labels
  for (const link of links) {
    const { isActive, edgeDimmed } = getLinkState(link);
    if (!edgeDimmed || isActive) continue;
    drawEdgeLabel(ctx, link, false, false, true, GRAPH_COLORS);
  }

  // —— 4. Edges (normal, then from-hovered, then active)
  const normalLinks = links.filter((link) => {
    const { isActive, edgeDimmed, edgeFromHoveredNode } = getLinkState(link);
    return !edgeDimmed && !edgeFromHoveredNode && !isActive;
  });
  const activeLinks = links.filter((link) => {
    const { isActive } = getLinkState(link);
    return isActive;
  });
  const activeHoveredLinks = links.filter((link) => {
    const { isActive, edgeFromHoveredNode } = getLinkState(link);
    return isActive || edgeFromHoveredNode;
  });

  if (!activeHoveredLinks.length) {
    normalLinks.forEach((link) => {
      const sx = link.source.x ?? 0;
      const sy = link.source.y ?? 0;
      const tx = link.target.x ?? 0;
      const ty = link.target.y ?? 0;
      ctx.strokeStyle = GRAPH_COLORS.linkStroke;
      ctx.lineWidth = EDGE_WIDTH_NORMAL;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    });
  }

  activeHoveredLinks.forEach((link) => {
    const sx = link.source.x ?? 0;
    const sy = link.source.y ?? 0;
    const tx = link.target.x ?? 0;
    const ty = link.target.y ?? 0;
    ctx.strokeStyle = GRAPH_COLORS.linkStrokeActive;
    ctx.lineWidth = EDGE_WIDTH_ACTIVE;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  });

  activeLinks.forEach((link) => {
    const sx = link.source.x ?? 0;
    const sy = link.source.y ?? 0;
    const tx = link.target.x ?? 0;
    const ty = link.target.y ?? 0;
    ctx.strokeStyle = GRAPH_COLORS.linkStrokeActive;
    ctx.lineWidth = EDGE_WIDTH_ACTIVE;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  });

  // —— 5. Nodes (non-dimmed)
  for (const node of nodes) {
    const isDimmed = hasFocus && !connectedNodeIds.has(node.id);
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

  // —— 6. Edge labels (normal, from-hovered, active)
  links
    .filter((link) => {
      const { isActive, edgeDimmed, edgeFromHoveredNode } =
        getLinkState(link);
      return !edgeDimmed && !edgeFromHoveredNode && !isActive;
    })
    .forEach((link) =>
      drawEdgeLabel(ctx, link, false, false, false, GRAPH_COLORS)
    );
  const fromHoveredLinks = links.filter((link) => {
    const { isActive, edgeFromHoveredNode } = getLinkState(link);
    return edgeFromHoveredNode && !isActive;
  });
  if (fromHoveredLinks.length <= MAX_FROM_HOVERED_EDGE_LABELS) {
    fromHoveredLinks.forEach((link) =>
      drawEdgeLabel(ctx, link, false, true, false, GRAPH_COLORS)
    );
  }
  links
    .filter((link) => getLinkState(link).isActive)
    .forEach((link) =>
      drawEdgeLabel(ctx, link, true, false, false, GRAPH_COLORS)
    );
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
