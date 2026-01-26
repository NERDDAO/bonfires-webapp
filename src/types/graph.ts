/**
 * Graph Data Types
 *
 * TypeScript interfaces for graph visualization data structures.
 */

export type NodeType = "entity" | "episode";

export interface GraphNode {
  uuid?: string;
  id?: string;
  name?: string;
  label?: string;
  title?: string;
  type?: NodeType | string;
  node_type?: NodeType | string;
  labels?: string[];
  properties?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
  content?: string;
  summary?: string;
  valid_at?: string;
  x?: number;
  y?: number;
  [key: string]: unknown;
}

export interface GraphEdge {
  source?: string;
  target?: string;
  type?: string;
  relationship?: string;
  label?: string;
  name?: string;
  fact?: string;
  properties?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
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

export interface GraphElementPayload {
  data: {
    id?: string;
    label?: string;
    node_type?: NodeType | string;
    source?: string;
    target?: string;
    [key: string]: unknown;
  };
  classes?: string | string[];
}

export interface GraphStatePayload {
  nodes: GraphElementPayload[];
  edges: GraphElementPayload[];
  nodeCount?: number;
  edgeCount?: number;
  centerNodeUuid?: string;
  lastUpdated?: string;
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
