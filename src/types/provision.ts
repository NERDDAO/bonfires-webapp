/**
 * Provision Types
 *
 * TypeScript interfaces for the ERC-1155 token-gated bonfire provisioning flow.
 * Used by the Provision Wizard (T4) and My Bonfires Dashboard (T5).
 */

export interface ProvisionFormData {
  agentName: string;
  description: string;
  capabilities: string[];
}

export type ProcessingStep =
  | "ipfs"
  | "approval"
  | "tx"
  | "backend"
  | "done"
  | "error";

export interface ProcessingState {
  step: ProcessingStep;
  txHash?: string;
  error?: string;
}

export interface ProvisionResult {
  bonfireId: string;
  agentId: string;
  erc8004BonfireId: number;
  apiKeyLast4: string;
  ipfsUri: string;
}

export type ProvisionedBonfireStatus = "pending" | "complete" | "failed";

export interface ProvisionedBonfireRecord {
  wallet_address: string;
  tx_hash: string;
  status: ProvisionedBonfireStatus;
  error_message: string | null;
  erc8004_bonfire_id: number;
  bonfire_id: string | null;
  agent_id: string | null;
  api_key_id: string | null;
  api_key_last4: string | null;
  ipfs_uri: string;
  agent_name: string;
  description: string;
  capabilities: string[];
  created_at: string;
  updated_at: string;
}
