"use client";

/**
 * useAgentDeploy
 *
 * React Query hooks for the agent deployment wizard:
 *  - useCreateAgent: mutation to create an agent via POST /api/agent-config
 *  - useMcpTools: query for available MCP tools
 *  - useValidateToken: mutation for bot token validation
 */
import { useMutation, useQuery } from "@tanstack/react-query";

import type {
  AgentDeployRequest,
  AgentDeployResult,
  McpTool,
  TokenValidationResult,
} from "@/types/agent-config";

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
  return useMutation({
    mutationFn: createAgentFn,
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
