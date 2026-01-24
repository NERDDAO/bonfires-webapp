/**
 * Graph Data Types
 *
 * TypeScript interfaces for graph visualization data structures.
 */

export type NodeType = "entity" | "episode";

export interface GraphNode {
  uuid: string;
  name: string;
  type: NodeType;
  labels: string[];
  properties: Record<string, unknown>;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

export interface GraphMetadata {
  bonfire_id: string;
  agent_id?: string;
  query?: string;
  timestamp: string;
}

// Graph Query Parameters
export interface GraphQueryParams {
  bonfire_id: string;
  agent_id?: string;
  center_uuid?: string;
  depth?: number;
  limit?: number;
  node_types?: NodeType[];
  search_query?: string;
}

export interface GraphExpandParams {
  bonfire_id: string;
  node_uuid: string;
  depth?: number;
  limit?: number;
}

export interface GraphSearchParams {
  bonfire_id: string;
  query: string;
  limit?: number;
  node_types?: NodeType[];
}

// Graph State Management
export interface GraphState {
  data: GraphData | null;
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  hoveredNode: GraphNode | null;
  loading: boolean;
  error: string | null;
}

export interface GraphFilters {
  nodeTypes: NodeType[];
  labels: string[];
  searchQuery: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
