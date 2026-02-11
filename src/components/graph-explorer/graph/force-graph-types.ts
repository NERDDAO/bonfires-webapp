/**
 * Force graph view types and component props.
 */

import type { GraphElement } from "@/lib/utils/sigma-adapter";

export interface ViewNode {
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

export interface ViewLink {
  source: ViewNode;
  target: ViewNode;
  id: string;
  label: string;
}

export interface ForceGraphProps {
  /** Graph elements (nodes + edges) from GraphExplorer */
  elements: GraphElement[];
  /** Called when a node is clicked (no drag) */
  onNodeClick?: (nodeId: string) => void;
  /** Called when an edge is clicked */
  onEdgeClick?: (edgeId: string) => void;
  /** Called when the background is clicked (not a node, not an edge, not a drag). Use to clear selection while keeping e.g. wiki panel open. */
  onBackgroundClick?: () => void;
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
