/**
 * API Response Types
 *
 * TypeScript interfaces for backend API responses.
 * These mirror the backend DTOs for type safety.
 */
import type { GraphStatePayload } from "./graph";

// Agent & Bonfire Types
export interface BonfireInfo {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  agent_count: number;
  is_public?: boolean;
  latest_taxonomies?: TaxonomyInfo[];
  /**
   * URL-safe slug for subdomain routing (e.g. "eth-boulder").
   * When present, used to build subdomain URLs: `{slug}.app.bonfires.ai`.
   * Falls back to lowercased, hyphenated name if not provided by backend.
   *
   * Backend extension: add `slug: str | None` to the BonfireInfo model.
   */
  slug?: string;
  /**
   * Optional per-bonfire site config overrides from the backend.
   * When present, merged with defaultSiteConfig in resolveSiteConfig().
   *
   * Backend extension: add `site_config: BonfireSiteConfig | None` to the model.
   * See BonfireSiteConfigOverrides in src/config/sites/types.ts.
   */
  site_config?: {
    theme?: {
      brandPrimary?: string;
      brandSecondary?: string;
      brandBlack?: string;
      brandSkyblue?: string;
    };
    features?: {
      graphExplorer?: boolean;
      exploreBonfires?: boolean;
    };
    landing_variant?: string;
  };
}

export interface AgentInfo {
  id: string;
  name: string;
  username?: string;
  is_active: boolean;
  bonfire_id: string;
  capabilities?: string[];
  episode_uuids?: string[];
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

// ============================================================================
// Job Response Types (for async polling)
// ============================================================================

/**
 * Full job response from backend /jobs/{id}/status endpoint
 */
export interface JobResponse {
  id: string;
  job_type: string;
  status: JobStatus;
  bonfire_id?: string;
  agent_id?: string;
  workflow_type?: string;
  progress?: number;
  result?: unknown;
  error?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

/**
 * Response when initiating an async job
 */
export interface JobInitiateResponse {
  jobId: string;
  status: JobStatus;
  message?: string;
}

/**
 * List of jobs response
 */
export interface JobsListResponse {
  jobs: JobResponse[];
  total: number;
}

/**
 * Active jobs response
 */
export interface ActiveJobsResponse {
  active_jobs: JobResponse[];
  count: number;
}

// ============================================================================
// Bonfire & Agent List Response Types
// ============================================================================

export interface BonfireListResponse {
  bonfires: BonfireInfo[];
}

export interface AgentListResponse {
  agents: AgentInfo[];
  total?: number;
}

export interface BonfireAgentsResponse {
  bonfire_id: string;
  agents: AgentInfo[];
  total_agents: number;
  active_agents: number;
}

// ============================================================================
// Chat Types
// ============================================================================

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatContextPayload {
  graphState?: GraphStatePayload;
  [key: string]: unknown;
}

export interface ChatRequest {
  message: string;
  chat_history?: ChatMessage[];
  agent_id: string;
  graph_mode?: "adaptive" | "static" | "dynamic" | "none";
  center_node_uuid?: string;
  graph_id?: string;
  bonfire_id?: string;
  context?: ChatContextPayload;
}

export interface ChatResponse {
  reply: string;
  graph_action?: string;
  search_prompt?: string;
  graph_data?: unknown;
  graph_operation?: unknown;
  new_graph_id?: string;
  graph_id?: string;
  center_node_uuid?: string;
  agent_id?: string;
  context?: Record<string, unknown>;
}

// ============================================================================
// Graph/Delve Types
// ============================================================================

export interface AgentEpisodesSearchRequest {
  limit?: number;
  before_time?: string | null;
  after_time?: string | null;
}

export interface AgentLatestEpisodesResponse {
  success: boolean;
  query: string;
  episodes: Record<string, unknown>[];
  nodes: Record<string, unknown>[];
  entities: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  num_results: number;
  bonfire_ids?: string[] | null;
  agent_context?: Record<string, unknown> | null;
  graph_id?: string | null;
}

export interface DelveRequest {
  query?: string;
  bonfire_id: string;
  num_results?: number;
  center_node_uuid?: string;
  graph_id?: string;
  search_recipe?: string;
  min_fact_rating?: number;
  mmr_lambda?: number;
  window_start?: string;
  window_end?: string;
  relationship_types?: string[];
}

export interface DelveResponse {
  success: boolean;
  query: string;
  entities?: Record<string, unknown>[];
  episodes?: Record<string, unknown>[];
  edges?: Record<string, unknown>[];
  nodes?: Record<string, unknown>[];
  metrics?: {
    entity_count?: number;
    episode_count?: number;
    edge_count?: number;
  };
}

export interface GraphExpandRequest {
  node_uuid: string;
  bonfire_id?: string;
  depth?: number;
  limit?: number;
}

export interface GraphSearchRequest {
  query: string;
  bonfire_id?: string;
  limit?: number;
  filters?: Record<string, unknown>;
}

export interface VectorSearchRequest {
  bonfire_ref: string;
  search_string: string;
  taxonomy_refs?: string[];
  agent_id?: string;
  limit?: number;
}

export interface VectorSearchResponse {
  success: boolean;
  results: Record<string, unknown>[];
  count: number;
  query?: string;
}

// ============================================================================
// Document Types
// ============================================================================

export interface DocumentIngestRequest {
  content: string;
  bonfire_id: string;
  filename?: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentIngestResponse {
  success: boolean;
  document_id?: string;
  message?: string;
}

/**
 * Document chunk with content and taxonomy labels
 */
export interface DocumentChunk {
  uuid: string;
  content: string;
  category?: string;
  index: number;
  document_id?: string;
  labels?: string[];
  created_at?: string;
}

/**
 * Extended document info with chunks
 */
export interface DocumentWithChunks extends DocumentInfo {
  chunks: DocumentChunk[];
  chunk_count: number;
}

/**
 * Taxonomy label with count information
 */
export interface TaxonomyLabel {
  name: string;
  count: number;
  color?: string;
}

export interface TaxonomyInfo {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  category?: string;
}

export interface TaxonomyStat {
  taxonomy_name: string;
  taxonomy_id?: string;
  chunk_count: number;
}

export interface TaxonomyStatsResponse {
  bonfire_id: string;
  total_chunks: number;
  labeled_chunks: number;
  unlabeled_chunks: number;
  taxonomy_stats: TaxonomyStat[];
  taxonomy_count: number;
}

/**
 * Document summary statistics
 */
export interface DocumentSummary {
  total_documents: number;
  total_chunks: number;
  labeled_chunks: number;
  unlabeled_chunks: number;
}

/**
 * Response from labeled chunks API endpoint
 */
export interface LabeledChunksResponse {
  bonfire_id?: string;
  view?: "chunks" | "documents";
  chunks?: DocumentChunk[];
  documents?: Record<string, unknown>[];
  chunks_by_taxonomy?: Record<string, unknown>;
  total_chunks?: number;
  labeled_chunks?: number;
  unlabeled_chunks?: number;
  taxonomy_count?: number;
  message?: string;
  page?: number;
  page_size?: number;
  total_pages?: number;
  has_next?: boolean;
  has_previous?: boolean;
  labels?: TaxonomyLabel[];
  summary?: DocumentSummary;
}

/**
 * Supported file types for document upload
 */
export type SupportedFileType = "pdf" | "txt" | "md" | "docx";

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
  type?: SupportedFileType;
}

// ============================================================================
// DataRoom Types
// ============================================================================

export interface DataRoomInfo {
  id: string;
  creator_wallet?: string;
  bonfire_id: string;
  description: string;
  system_prompt?: string;
  center_node_uuid?: string;
  price_usd: number;
  query_limit: number;
  expiration_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  creator_username?: string;
  bonfire_name?: string;
  agent_id?: string;
  dynamic_pricing_enabled?: boolean;
  price_step_usd?: number;
  price_decay_rate?: number;
  total_purchases?: number;
  last_purchase_at?: string;
  image_model?: "schnell" | "dev" | "pro" | "realism";
}

export interface DataRoomListResponse {
  datarooms: DataRoomInfo[];
  count: number;
  limit: number;
  offset: number;
}

export interface CreateDataRoomRequest {
  creator_wallet?: string;
  bonfire_id: string;
  description: string;
  system_prompt: string;
  center_node_uuid?: string;
  price_usd: number;
  query_limit: number;
  expiration_days: number;
  dynamic_pricing_enabled?: boolean;
  price_step_usd?: number;
  price_decay_rate?: number;
  image_model?: "schnell" | "dev" | "pro" | "realism";
  htn_template_id?: string;
}

// ============================================================================
// HTN Template Types
// ============================================================================

export interface HTNTemplateInfo {
  id: string;
  name: string;
  template_type: string;
  description: string | null;
  system_prompt: string;
  user_prompt_template: string;
  node_count_config: Record<string, { max_nodes: number; max_words: number; description: string }>;
  default_length: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface HTNTemplateListResponse {
  templates: HTNTemplateInfo[];
  count: number;
}

export interface CreateHTNTemplateRequest {
  name: string;
  template_type: string;
  description?: string;
  system_prompt: string;
  user_prompt_template: string;
  node_count_config: Record<string, { max_nodes: number; max_words: number; description: string }>;
  default_length: string;
  created_by?: string;
}

export interface DataRoomSubscribeRequest {
  payment_header: string;
  user_wallet: string;
}

export interface DataRoomSubscription {
  id: string;
  dataroom_id: string;
  user_wallet: string;
  queries_remaining: number;
  expires_at: string;
  status: "active" | "expired" | "cancelled";
  created_at: string;
}

// ============================================================================
// HyperBlog Types
// ============================================================================

export interface HyperBlogInfo {
  id: string;
  dataroom_id: string;
  user_query: string;
  generation_status: "generating" | "completed" | "failed";
  author_wallet: string;
  author_name?: string;
  author_username?: string;
  created_at: string;
  is_public: boolean;
  tx_hash: string | null;
  word_count: number | null;
  blog_length: "short" | "medium" | "long";
  generation_mode?: "blog" | "card";
  preview: string;
  summary?: string | null;
  image_prompt?: string | null;
  banner_url?: string | null;
  upvotes?: number;
  downvotes?: number;
  comment_count?: number;
  view_count?: number;
  taxonomy_keywords?: string[] | null;
  dataroom_description?: string | null;
  blog_content?: {
    formatted_content?: string | null;
  };
}

export interface HyperBlogListResponse {
  hyperblogs: HyperBlogInfo[];
  count: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Payment Types
// ============================================================================

export interface PaymentMetadata {
  verified: boolean;
  settled: boolean;
  from_address?: string;
  facilitator?: string;
  tx_hash?: string;
  settlement_error?: string;
  microsub_active?: boolean;
  queries_remaining?: number;
  expires_at?: string;
}

export interface PaymentVerifyRequest {
  payment_header: string;
  expected_amount?: string;
  resource_type: "chat" | "delve" | "dataroom" | "hyperblog";
  resource_id?: string;
}

export interface PaymentVerifyResponse {
  verified: boolean;
  tx_hash?: string;
  from_address?: string;
  amount?: string;
  error?: string;
}

export interface PaymentStatusRequest {
  tx_hash: string;
}

export interface PaymentStatusResponse {
  status: "pending" | "confirmed" | "failed";
  tx_hash: string;
  confirmed_at?: string;
  error?: string;
}
