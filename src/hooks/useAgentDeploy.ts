"use client";

/**
 * useAgentDeploy
 *
 * React Query hooks for the agent deployment wizard:
 *  - useCreateAgent: mutation to create an agent via POST /api/agent-config
 *  - useUpdateAgent: mutation to update an agent via PUT /api/agents/[id]
 *  - useBonfireAgents: query for agents registered to a bonfire
 *  - useAgentDetails: query for full agent details (edit mode)
 *  - useMcpTools: query for available MCP tools
 *  - useValidateToken: mutation for bot token validation
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  AgentDeployRequest,
  AgentDeployResult,
  AgentFullResponse,
  AgentUpdateRequest,
  McpTool,
  TokenValidationResult,
} from "@/types/agent-config";
import type { BonfireAgentsResponse } from "@/types/api";

// ── Create Agent ─────────────────────────────────────────────────────────────

async function createAgentFn(data: AgentDeployRequest): Promise<AgentDeployResult> {
  const res = await fetch("/api/agent-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to create agent (${res.status})`);
  }

  return res.json() as Promise<AgentDeployResult>;
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAgentFn,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bonfire-agents", variables.bonfireId] });
    },
  });
}

// ── Update Agent ─────────────────────────────────────────────────────────────

async function updateAgentFn({
  agentId,
  data,
}: {
  agentId: string;
  data: AgentUpdateRequest;
}): Promise<AgentFullResponse> {
  const res = await fetch(`/api/agents/${agentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to update agent (${res.status})`);
  }

  return res.json() as Promise<AgentFullResponse>;
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAgentFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agent-details", data.id] });
      if (data.bonfire_ref) {
        queryClient.invalidateQueries({ queryKey: ["bonfire-agents", data.bonfire_ref] });
      }
    },
  });
}

// ── Bonfire Agents ───────────────────────────────────────────────────────────

async function fetchBonfireAgents(bonfireId: string): Promise<BonfireAgentsResponse> {
  const res = await fetch(`/api/bonfires/${bonfireId}/agents`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to fetch bonfire agents");
  }
  return res.json() as Promise<BonfireAgentsResponse>;
}

export function useBonfireAgents(bonfireId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["bonfire-agents", bonfireId],
    queryFn: () => fetchBonfireAgents(bonfireId!),
    enabled: enabled && !!bonfireId,
    staleTime: 30_000,
  });
}

// ── Agent Details ────────────────────────────────────────────────────────────

async function fetchAgentDetails(agentId: string): Promise<AgentFullResponse> {
  const res = await fetch(`/api/agents/${agentId}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to fetch agent details");
  }
  return res.json() as Promise<AgentFullResponse>;
}

export function useAgentDetails(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agent-details", agentId],
    queryFn: () => fetchAgentDetails(agentId!),
    enabled: !!agentId,
    staleTime: 30_000,
  });
}

// ── MCP Tools ────────────────────────────────────────────────────────────────

async function fetchMcpTools(): Promise<McpTool[]> {
  const res = await fetch("/api/agent-config/mcp-tools");
  if (!res.ok) {
    throw new Error("Failed to fetch MCP tools");
  }
  return res.json() as Promise<McpTool[]>;
}

export function useMcpTools(enabled = true) {
  return useQuery({
    queryKey: ["mcp-tools"],
    queryFn: fetchMcpTools,
    staleTime: 10 * 60 * 1000,
    enabled,
  });
}

// ── Token Validation ─────────────────────────────────────────────────────────

type TokenPlatform = "telegram" | "discord";

async function validateTokenFn({
  platform,
  token,
}: {
  platform: TokenPlatform;
  token: string;
}): Promise<TokenValidationResult> {
  const endpoint =
    platform === "telegram"
      ? "/api/agent-config/validate-telegram-token"
      : "/api/agent-config/validate-discord-token";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Token validation request failed");
  }

  return res.json() as Promise<TokenValidationResult>;
}

export function useValidateToken() {
  return useMutation({
    mutationFn: validateTokenFn,
  });
}

// ── Bonfire Pricing ──────────────────────────────────────────────────────────

export interface BonfirePricing {
  price_per_episode: string | null;
  max_episodes_per_agent: number;
  max_agents: number;
}

async function fetchBonfirePricing(bonfireId: string): Promise<BonfirePricing> {
  const res = await fetch(`/api/bonfires/${bonfireId}/pricing`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to fetch bonfire pricing");
  }
  return res.json() as Promise<BonfirePricing>;
}

export function useBonfirePricing(bonfireId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["bonfire-pricing", bonfireId],
    queryFn: () => fetchBonfirePricing(bonfireId!),
    enabled: enabled && !!bonfireId,
    staleTime: 30_000,
  });
}

async function updateBonfirePricingFn({
  bonfireId,
  data,
}: {
  bonfireId: string;
  data: BonfirePricing;
}): Promise<BonfirePricing> {
  const res = await fetch(`/api/bonfires/${bonfireId}/pricing`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to update pricing");
  }
  return res.json() as Promise<BonfirePricing>;
}

export function useUpdateBonfirePricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBonfirePricingFn,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bonfire-pricing", variables.bonfireId] });
    },
  });
}

// ── Purchase Agent ───────────────────────────────────────────────────────────

export interface PurchaseAgentPayload {
  payment_header: string;
  platform: "web" | "telegram" | "discord";
  episodes_requested: number;
  agent_name: string;
  agent_context: string;
  telegram_bot_token?: string;
  discord_bot_token?: string;
}

export interface PurchaseAgentResult {
  agent_id: string;
  username: string;
  platform: string;
  episodes_purchased: number;
  api_key_last4: string;
  purchase_id: string;
}

async function purchaseAgentFn({
  bonfireId,
  data,
}: {
  bonfireId: string;
  data: PurchaseAgentPayload;
}): Promise<PurchaseAgentResult> {
  const res = await fetch(`/api/bonfires/${bonfireId}/purchase-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Purchase failed (${res.status})`);
  }
  return res.json() as Promise<PurchaseAgentResult>;
}

export function usePurchaseAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchaseAgentFn,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bonfire-agents", variables.bonfireId] });
    },
  });
}
