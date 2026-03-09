export interface NodeData {
  id: string;
  label?: string;
  name?: string;
  type?: "episode" | "entity" | "unknown";
  node_type?: "episode" | "entity" | "unknown";
  [key: string]: unknown;
}
