export interface ApplicantReviewBatchInfo {
  id: string;
  name: string;
  status: string;
  rubric_version: string;
  imported_count: number;
  research_completed_count: number;
  evaluation_completed_count: number;
  shortlisted_count: number;
  agent_id?: string | null;
  source_name?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface ApplicantReviewListItem {
  id: string;
  batch_id: string;
  row_index: number;
  full_name: string;
  ethereum_address?: string | null;
  twitter_handle?: string | null;
  github_profile_url?: string | null;
  role_title?: string | null;
  organizations: string[];
  research_status: string;
  evaluation_status: string;
  shortlist_status: string;
  overall_score?: number | null;
  recommendation?: string | null;
  confidence_score?: number | null;
  validation_errors: string[];
  public_evidence_links: string[];
  evidence_count: number;
  review_summary?: string | null;
  updated_at: string;
  created_at: string;
}

export interface ApplicantReviewListResponse {
  items: ApplicantReviewListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApplicantIdentityInfo {
  id: string;
  full_name: string;
  ethereum_address?: string | null;
  github_handle?: string | null;
  github_url?: string | null;
  twitter_handle?: string | null;
  twitter_url?: string | null;
  telegram_handle?: string | null;
  telegram_url?: string | null;
  organizations: string[];
  role_title?: string | null;
}

export interface ApplicantCategoryScoreInfo {
  name: string;
  weight: number;
  score: number;
  reasoning: string;
}

export interface ApplicantReviewInfo {
  id: string;
  weighted_score: number;
  confidence_score: number;
  recommendation: string;
  category_scores: ApplicantCategoryScoreInfo[];
  strengths: string[];
  concerns: string[];
  rationale: string;
  bio?: string;
  comparative_reasoning?: string;
  is_shortlisted: boolean;
  override_note?: string | null;
  rubric_version: string;
}

export interface ApplicantReviewDetailResponse {
  application: ApplicantReviewListItem & {
    normalized_fields?: Record<string, unknown>;
    raw_row?: Record<string, unknown>;
    evidence?: Array<Record<string, unknown>>;
    top_researcher_claim?: string | null;
    primary_contribution?: string | null;
    other_security_areas?: string | null;
    verification_post_url?: string | null;
    heard_about_program?: string | null;
    vouches?: string[];
    priority_issues?: string | null;
    referred_by?: string | null;
    telegram_handle?: string | null;
    telegram_url?: string | null;
  };
  batch?: ApplicantReviewBatchInfo | null;
  identity?: ApplicantIdentityInfo | null;
  review?: ApplicantReviewInfo | null;
}

export interface ApplicantReviewActionResponse {
  success: boolean;
  task_id?: string | null;
  review?: ApplicantReviewInfo | null;
  application?: ApplicantReviewListItem | null;
}

export interface ApplicantReviewBatchImportResponse {
  success: boolean;
  batch_id: string;
  imported_count: number;
  queued_task_ids: string[];
}
