/**
 * Graph theme colors and settings for sigma.js
 * Consistent theming across the graph visualization
 */

export const GraphThemeColors = {
  background: "transparent",
  dark: "#0b0e14",
  accent: "#1DE9AC",
  nodeFill: "#7CA0AB",
  edgeFill: "#555",
  labelColor: "#fff",
  labelStroke: "#0b0e14",
  edgeHighlight: "#00b4d8",
} as const;

/**
 * Default node type colors
 * Color scheme for different node types in the graph
 */
export const NODE_COLOR_DEFAULTS = {
  episodeColor: "#4fc5ff", // Cyan/blue for episodes
  entityColor: "#99ff55", // Green for entities
  userColor: "#ff7b48", // Orange for user nodes
  unknownColor: "#ff4d4f", // Red for unknown types
} as const;

export type NodeColorDefaults = typeof NODE_COLOR_DEFAULTS;

/**
 * Sigma.js settings configuration
 * Use these settings when creating SigmaContainer
 */
export const SigmaSettings = {
  allowInvalidContainer: true,
  renderLabels: true,
  labelFont: "Inter, system-ui, sans-serif",
  labelSize: 11,
  labelWeight: "500",
  labelColor: { attribute: "labelColor", color: GraphThemeColors.labelColor },
  defaultNodeColor: GraphThemeColors.nodeFill,
  defaultEdgeColor: GraphThemeColors.edgeFill,
  edgeLabelFont: "Inter, system-ui, sans-serif",
  edgeLabelSize: 10,
  renderEdgeLabels: true,
  stagePadding: 50,
  minCameraRatio: 0.1,
  maxCameraRatio: 10,
  enableEdgeEvents: true,
  defaultNodeType: "circle",
  labelDensity: 0.07,
  labelRenderedSizeThreshold: 6,
  labelGridCellSize: 120,
} as const;
