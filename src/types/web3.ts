/**
 * Web3 Types
 *
 * TypeScript interfaces for Web3 features including data rooms,
 * hyperblogs, and payment transactions.
 */

// Data Room Types
export interface DataRoomInfo {
  id: string;
  creator_wallet: string;
  bonfire_id: string;
  center_node_uuid?: string;
  description: string;
  system_prompt: string;
  price_usd: number;
  query_limit: number;
  expiration_days: number;
  dynamic_pricing_enabled: boolean;
  created_at: string;
  subscriber_count: number;
}

export type SubscriptionStatus = "active" | "expired" | "cancelled";

export interface DataRoomSubscription {
  id: string;
  dataroom_id: string;
  user_wallet: string;
  queries_remaining: number;
  expires_at: string;
  status: SubscriptionStatus;
  created_at: string;
}

// HyperBlog Types
export type HyperBlogStatus = "pending" | "generating" | "complete" | "failed";

export interface HyperBlogInfo {
  id: string;
  title: string;
  content: string;
  author_wallet: string;
  dataroom_id: string;
  price_usd: number;
  view_count: number;
  is_free: boolean;
  created_at: string;
  generation_status: HyperBlogStatus;
}

// Payment Types
export type PaymentStatus = "pending" | "confirmed" | "failed";
export type PaymentType = "chat" | "delve" | "dataroom" | "hyperblog";

export interface PaymentTransaction {
  id: string;
  user_wallet: string;
  amount_usd: number;
  tx_hash: string;
  status: PaymentStatus;
  type: PaymentType;
  resource_id: string;
  created_at: string;
}

// Wallet State
export interface WalletState {
  address: string | null;
  chainId: number | null;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
}

// Payment Request Params
export interface PaymentParams {
  amount_usd: number;
  type: PaymentType;
  resource_id: string;
  description?: string;
}
