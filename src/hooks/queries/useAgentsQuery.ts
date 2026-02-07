/**
 * useAgentsQuery Hook
 *
 * React Query hook for fetching agents for a specific bonfire.
 * Disabled until a bonfireId is provided.
 */
"use client";

import type { AgentInfo, BonfireAgentsResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

/**
 * useAgentsQuery Hook
 *
 * React Query hook for fetching agents for a specific bonfire.
 * Disabled until a bonfireId is provided.
 */

interface UseAgentsQueryParams {
  bonfireId: string | null;
  enabled?: boolean;
}

/**
 * Generate query key for agents
 */
export function agentsQueryKey(bonfireId: string | null) {
  return ["agents", { bonfireId }] as const;
}

/**
 * Fetch agents for a specific bonfire
 */
export function useAgentsQuery({
  bonfireId,
  enabled = true,
}: UseAgentsQueryParams) {
  return useQuery({
    queryKey: agentsQueryKey(bonfireId),
    queryFn: () =>
      apiClient.get<BonfireAgentsResponse>(`/api/bonfires/${bonfireId}/agents`),
    enabled: enabled && !!bonfireId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get a specific agent by ID from the cached list
 */
export function useAgentById(bonfireId: string | null, agentId: string | null) {
  const { data, ...rest } = useAgentsQuery({ bonfireId });

  const agent: AgentInfo | null = agentId
    ? (data?.agents.find((a) => a.id === agentId) ?? null)
    : null;

  return {
    data: agent,
    ...rest,
  };
}

/**
 * Get only active agents from a bonfire
 */
export function useActiveAgents(bonfireId: string | null) {
  const { data, ...rest } = useAgentsQuery({ bonfireId });

  const activeAgents = data?.agents.filter((a) => a.is_active) ?? [];

  return {
    data: activeAgents,
    totalCount: data?.total_agents ?? 0,
    activeCount: data?.active_agents ?? 0,
    ...rest,
  };
}
