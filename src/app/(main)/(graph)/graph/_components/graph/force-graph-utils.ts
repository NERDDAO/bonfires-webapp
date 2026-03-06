/**
 * Force graph color and label utilities.
 */

import {
  DIM_DARKEN_FACTOR,
  GRAPH_COLORS,
  NODE_TYPE_COLORS,
} from "./force-graph-constants";

/** Returns a darker rgb string from a color (hex or rgb(r,g,b)) */
export function darkenColor(
  color: string,
  factor: number = DIM_DARKEN_FACTOR
): string {
  let r = 0,
    g = 0,
    b = 0;
  const hexMatch = color.match(
    /^#?([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})$/
  );
  if (hexMatch) {
    r = parseInt(hexMatch[1] ?? "0", 16);
    g = parseInt(hexMatch[2] ?? "0", 16);
    b = parseInt(hexMatch[3] ?? "0", 16);
  } else {
    const rgbMatch = color.match(
      /rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/
    );
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

export function truncateLabel(
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

/** Convert snake case to title case for edge labels */
export function getEdgeLabel(edgeLabel: string): string {
  const lowerCaseLabel = edgeLabel.toLowerCase();
  const sentenceCaseLabel = lowerCaseLabel.replace(/_/g, " ");
  return sentenceCaseLabel;
}

export function getNodeColor(
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

export type GraphColorsType = typeof GRAPH_COLORS;
