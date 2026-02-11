/**
 * Force graph layout and styling constants.
 */

import { NODE_COLOR_DEFAULTS } from "@/lib/utils/graph-theme";

/** Node radius by size tier (1–5). Obsidian-style: smaller, denser nodes */
export const RADIUS_BY_SIZE: Record<number, number> = {
  1: 4,
  2: 5,
  3: 6,
  4: 10,
  5: 14,
};

export const LAYOUT_ALPHA_MIN = 0.0005;
/** Ideal link length; higher = more space between connected nodes (avoids increasing charge which causes bouncy drag) */
export const LINK_DISTANCE = 140;
export const LINK_STRENGTH = 0.5;
export const CHARGE_STRENGTH = -280;
export const COLLISION_PADDING = 18;
export const CENTER_STRENGTH = 0.06;
export const ALPHA_DECAY = 0.018;
export const VELOCITY_DECAY = 0.65;
export const ZOOM_MIN = 0.65;
export const ZOOM_MAX = 2;
export const GRAPH_WIDTH = 3200;
export const GRAPH_HEIGHT = 2400;
export const MAX_LABEL_WIDTH = 80;
export const MAX_FROM_HOVERED_EDGE_LABELS = 1;

export const GRAPH_COLORS = {
  linkStroke: "rgba(95, 95, 95, 0.5)",
  linkStrokeDimmed: "rgb(28, 28, 28)",
  linkStrokeActive: "rgba(255, 255, 255, 0.5)",
  linkLabelFill: "rgb(200, 200, 200)",
  linkLabelFillDimmed: "rgb(45, 45, 45)",
  linkLabelFillActive: "rgb(255, 255, 255)",
  nodeFill: "rgb(179, 179, 179)",
  nodeStroke: "rgb(179, 179, 179)",
  labelFill: "rgb(246, 246, 246)",
  labelFillDimmed: "rgb(48, 48, 48)",
  nodeFillHover: "rgb(220, 220, 220)",
  nodeStrokeHover: "rgb(255, 255, 255)",
  labelFillHover: "rgb(255, 255, 255)",
  labelFontSizeHoverOffset: 1,
  labelFontWeightHover: "600",
  nodeFillSelected: "rgb(220, 220, 220)",
  nodeStrokeSelected: "rgb(255, 255, 255)",
} as const;

export const EDGE_LABEL_MAX_WIDTH = 64;
export const EDGE_HIT_THRESHOLD = 6;

/** Edge line widths (px) */
export const EDGE_WIDTH_NORMAL = 0.8;
export const EDGE_WIDTH_DIMMED = 1;
export const EDGE_WIDTH_ACTIVE = 0.8;
/** Perpendicular offset (px) from edge line for edge label placement */
export const EDGE_LABEL_OFFSET = 10;
/** Factor to darken node fill/stroke when dimmed (multiply RGB by this) */
export const DIM_DARKEN_FACTOR = 0.22;

/** Entity-based node color (aligned with SigmaGraph / graph-theme) */
export const NODE_TYPE_COLORS = {
  episode: NODE_COLOR_DEFAULTS.episodeColor,
  entity: NODE_COLOR_DEFAULTS.entityColor,
  user: NODE_COLOR_DEFAULTS.userColor,
  unknown: NODE_COLOR_DEFAULTS.unknownColor,
} as const;
