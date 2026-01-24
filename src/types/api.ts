/**
 * API Response Types
 *
 * TypeScript interfaces for backend API responses.
 * These mirror the backend DTOs for type safety.
 */

// Agent & Bonfire Types
export interface BonfireInfo {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  agent_count: number;
}

export interface AgentInfo {
  id: string;
  name: string;
  username?: string;
  is_active: boolean;
  bonfire_id: string;
  capabilities?: string[];
}

export interface AgentSelectionState {
  selectedBonfire: BonfireInfo | null;
  selectedAgent: AgentInfo | null;
  availableBonfires: BonfireInfo[];
  availableAgents: AgentInfo[];
  loading: {
    bonfires: boolean;
    agents: boolean;
  };
  error: {
    bonfires?: string;
    agents?: string;
  };
}

// Document Types
export interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  bonfire_id: string;
  uploaded_at: string;
  processed: boolean;
  status: "pending" | "processing" | "completed" | "failed";
}

// Async Job Types
export type JobStatus = "pending" | "processing" | "complete" | "failed";
export type JobType = "graph_query" | "graph_expand" | "hyperblog_generation";

export interface AsyncJob<T = unknown> {
  id: string;
  type: JobType;
  status: JobStatus;
  progress?: number; // 0-100
  result?: T;
  error?: string;
  created_at: string;
  completed_at?: string;
}

// API Response Wrappers
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}
