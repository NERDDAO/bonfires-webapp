"use client";

/**
 * useAgentConfig
 *
 * React Query hooks for the agent config dashboard:
 *  - Env vars: list, upsert, delete
 *  - Personality: get, add, update, delete, replace
 *  - Chat config: get, update
 *  - Agent features: get, update
 *  - Skills: get, update
 *  - Tools: list MCP tools
 *  - Agent lifecycle: delete, toggle active
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  AgentDeleteResponse,
  AgentFeatures,
  AgentUpdateRequest,
  ChatConfig,
  EnvVarDeleteResponse,
  EnvVarsListResponse,
  EnvVarsUpsertResponse,
  PersonalityResponse,
  PersonalityTrait,
  PersonalityTraitsModifyResponse,
  SkillsListResponse,
  ToolsListResponse,
} from "@/types/agent-config";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ── Env Vars ─────────────────────────────────────────────────────────────────

export function useAgentEnvVars(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agent-env-vars", agentId],
    queryFn: () => fetchJson<EnvVarsListResponse>(`/api/agents/${agentId}/env-vars`),
    enabled: !!agentId,
    staleTime: 30_000,
  });
}

export function useUpsertEnvVars() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, vars }: { agentId: string; vars: Record<string, string> }) =>
      fetchJson<EnvVarsUpsertResponse>(`/api/agents/${agentId}/env-vars`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vars }),
      }),
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["agent-env-vars", agentId] });
    },
  });
}

export function useDeleteEnvVar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, key }: { agentId: string; key: string }) =>
      fetchJson<EnvVarDeleteResponse>(
        `/api/agents/${agentId}/env-vars/${encodeURIComponent(key)}`,
        { method: "DELETE" },
      ),
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["agent-env-vars", agentId] });
    },
  });
}

// ── Personality ──────────────────────────────────────────────────────────────

export function useAgentPersonality(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agent-personality", agentId],
    queryFn: () => fetchJson<PersonalityResponse>(`/api/agents/${agentId}/personality`),
    enabled: !!agentId,
    staleTime: 30_000,
  });
}

export function useAddPersonalityTraits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      traits,
    }: {
      agentId: string;
      traits: Array<{ section: string; content: string }>;
    }) =>
      fetchJson<PersonalityTraitsModifyResponse>(
        `/api/agents/${agentId}/personality/traits`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ traits }),
        },
      ),
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["agent-personality", agentId] });
    },
  });
}

export function useUpdatePersonalityTraits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      traits,
    }: {
      agentId: string;
      traits: Array<{ id: string; section: string; content: string }>;
    }) =>
      fetchJson<PersonalityTraitsModifyResponse>(
        `/api/agents/${agentId}/personality/traits`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ traits }),
        },
      ),
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["agent-personality", agentId] });
    },
  });
}

export function useDeletePersonalityTraits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, traitIds }: { agentId: string; traitIds: string[] }) =>
      fetchJson<PersonalityTraitsModifyResponse>(
        `/api/agents/${agentId}/personality/traits`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trait_ids: traitIds }),
        },
      ),
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["agent-personality", agentId] });
    },
  });
}

export function useReplacePersonality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      traits,
    }: {
      agentId: string;
      traits: Array<{ section: string; content: string }>;
    }) =>
      fetchJson<PersonalityResponse>(
        `/api/agents/${agentId}/personality/replace`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ traits }),
        },
      ),
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["agent-personality", agentId] });
    },
  });
}

// ── Tools ────────────────────────────────────────────────────────────────────

export function useToolsCatalog(enabled = true) {
  return useQuery({
    queryKey: ["tools-catalog"],
    queryFn: () => fetchJson<ToolsListResponse>("/api/tools/mcp"),
    staleTime: 10 * 60 * 1000,
    enabled,
  });
}

export function useSkillsCatalog(enabled = true) {
  return useQuery({
    queryKey: ["skills-catalog"],
    queryFn: () => fetchJson<SkillsListResponse>("/api/tools/skills"),
    staleTime: 10 * 60 * 1000,
    enabled,
  });
}

// ── Chat Config ─────────────────────────────────────────────────────────────

export function useAgentChatConfig(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agent-chat-config", agentId],
    queryFn: () => fetchJson<ChatConfig>(`/api/agents/${agentId}/chat-config`),
    enabled: !!agentId,
    staleTime: 30_000,
  });
}

export function useUpdateChatConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, chatConfig }: { agentId: string; chatConfig: ChatConfig }) =>
      fetchJson<ChatConfig>(`/api/agents/${agentId}/chat-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatConfig }),
      }),
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["agent-chat-config", agentId] });
      qc.invalidateQueries({ queryKey: ["agent-details", agentId] });
    },
  });
}

// ── Agent Features ──────────────────────────────────────────────────────────

export function useAgentFeatures(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agent-features", agentId],
    queryFn: () => fetchJson<AgentFeatures>(`/api/agents/${agentId}/features`),
    enabled: !!agentId,
    staleTime: 30_000,
  });
}

export function useUpdateAgentFeatures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, agentFeatures }: { agentId: string; agentFeatures: AgentFeatures }) =>
      fetchJson<AgentFeatures>(`/api/agents/${agentId}/features`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentFeatures }),
      }),
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["agent-features", agentId] });
      qc.invalidateQueries({ queryKey: ["agent-details", agentId] });
    },
  });
}

// ── Skills ──────────────────────────────────────────────────────────────────

export function useAgentSkills(agentId: string | undefined) {
  return useQuery({
    queryKey: ["agent-skills", agentId],
    queryFn: () => fetchJson<string[]>(`/api/agents/${agentId}/skills`),
    enabled: !!agentId,
    staleTime: 30_000,
  });
}

export function useUpdateAgentSkills() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, enabledSkills }: { agentId: string; enabledSkills: string[] }) =>
      fetchJson<string[]>(`/api/agents/${agentId}/skills`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabledSkills }),
      }),
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["agent-skills", agentId] });
      qc.invalidateQueries({ queryKey: ["agent-details", agentId] });
    },
  });
}

// ── Agent Lifecycle ──────────────────────────────────────────────────────────

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) =>
      fetchJson<AgentDeleteResponse>(`/api/agents/${agentId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bonfire-agents"] });
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useToggleAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, isActive }: { agentId: string; isActive: boolean }) =>
      fetchJson<unknown>(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      }),
    onSuccess: (_, { agentId }) => {
      qc.invalidateQueries({ queryKey: ["agent-details", agentId] });
      qc.invalidateQueries({ queryKey: ["bonfire-agents"] });
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}
