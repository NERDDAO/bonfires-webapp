/**
 * Dashboard Types
 *
 * TypeScript interfaces for the unified dashboard page.
 * Aggregates data from multiple sources (API, localStorage, wallet).
 */
import type {
  AgentInfo,
  DataRoomInfo,
  DataRoomSubscription,
  DocumentInfo,
  HyperBlogInfo,
} from "./api";
import type { PaymentTransaction, WalletState } from "./web3";

/**
 * Recent chat summary from localStorage
 */
export interface RecentChatSummary {
  agentId: string;
  agentName?: string;
  lastMessage: string;
  lastUpdated: string;
  messageCount: number;
}

/**
 * Document summary for dashboard (by bonfire)
 */
export interface DashboardDocumentSummary {
  bonfireId: string;
  bonfireName?: string;
  documentCount: number;
  lastUpload?: string;
}

/**
 * Created data room with additional stats
 */
export interface CreatedDataRoom extends DataRoomInfo {
  subscriberCount?: number;
  totalRevenue?: number;
}

/**
 * Subscribed data room with subscription details
 */
export interface SubscribedDataRoom {
  dataroom: DataRoomInfo;
  subscription: DataRoomSubscription;
}

/**
 * Dashboard section loading state
 */
export interface DashboardSectionState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  refetch: () => void;
}

/**
 * Complete dashboard data structure
 */
export interface DashboardData {
  /** Recent chat conversations from localStorage */
  recentChats: DashboardSectionState<RecentChatSummary[]>;

  /** Data rooms created by the user */
  createdDataRooms: DashboardSectionState<DataRoomInfo[]>;

  /** Data rooms the user is subscribed to */
  subscribedDataRooms: DashboardSectionState<DataRoomSubscription[]>;

  /** Documents uploaded by the user (aggregated by bonfire) */
  documents: DashboardSectionState<DocumentInfo[]>;

  /** HyperBlogs created by the user */
  hyperBlogs: DashboardSectionState<HyperBlogInfo[]>;

  /** User's payment history */
  paymentHistory: DashboardSectionState<PaymentTransaction[]>;

  /** Wallet connection state */
  wallet: WalletState;
}

/**
 * Quick action types for dashboard items
 */
export type QuickActionType =
  | "continue_chat"
  | "access_dataroom"
  | "view_document"
  | "edit_hyperblog"
  | "renew_subscription";

/**
 * Quick action definition
 */
export interface QuickAction {
  type: QuickActionType;
  label: string;
  href: string;
  icon?: string;
}

/**
 * Payment history query params
 */
export interface PaymentHistoryParams {
  userWallet: string | null;
  limit?: number;
  offset?: number;
}

/**
 * Payment history API response
 */
export interface PaymentHistoryResponse {
  transactions: PaymentTransaction[];
  total: number;
  limit: number;
  offset: number;
}
