"use client";

/**
 * useAgentSelectionQuery Hook
 *
 * React Query–based bonfire and agent selection. Uses useBonfiresQuery and
 * useAgentsQuery instead of raw fetch. Same API as useAgentSelection so it
 * can be used with AgentSelector and similar UIs. Does not modify the
 * original useAgentSelection hook (used elsewhere).
 */
import { useCallback, useMemo, useState } from "react";

import type { AgentInfo, AgentSelectionState, BonfireInfo } from "@/types";

import { useAgentsQuery } from "./useAgentsQuery";
import { useBonfiresQuery } from "./useBonfiresQuery";

interface UseAgentSelectionQueryConfig {
  initialBonfireId?: string | null;
  initialAgentId?: string | null;
}

function normalizeAgent(a: AgentInfo, bonfireId: string): AgentInfo {
  return {
    ...a,
    id: String(a?.id ?? ""),
    username: String(a?.username ?? a?.name ?? a?.id ?? ""),
    name: a?.name ?? a?.username ?? a?.id ?? "",
    bonfire_id: a?.bonfire_id ?? bonfireId,
    is_active: a?.is_active ?? true,
  };
}

export function useAgentSelectionQuery(
  selectionConfig?: UseAgentSelectionQueryConfig
) {
  const [selectedBonfireId, setSelectedBonfireId] = useState<string | null>(
    selectionConfig?.initialBonfireId ?? null
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    selectionConfig?.initialAgentId ?? null
  );

  const bonfiresQuery = useBonfiresQuery();
  const agentsQuery = useAgentsQuery({
    bonfireId: selectedBonfireId,
    enabled: !!selectedBonfireId,
  });

  const availableBonfires = bonfiresQuery.data?.bonfires ?? [];
  const rawAgents = agentsQuery.data?.agents ?? [];
  const availableAgents = useMemo(
    () =>
      selectedBonfireId
        ? rawAgents
            .map((a) => normalizeAgent(a, selectedBonfireId))
            .filter((a) => a.id && a.id.length > 0)
        : [],
    [rawAgents, selectedBonfireId]
  );

  const selectedBonfire =
    availableBonfires.find((b) => b.id === selectedBonfireId) ?? null;
  const selectedAgent =
    availableAgents.find((a) => a.id === selectedAgentId) ?? null;

  const selectBonfire = useCallback((bonfireId: string | null) => {
    setSelectedBonfireId(bonfireId);
    setSelectedAgentId(null);
  }, []);

  const selectAgent = useCallback((agentId: string | null) => {
    setSelectedAgentId(agentId);
  }, []);

  const selectionState: AgentSelectionState = useMemo(
    () => ({
      selectedBonfire,
      selectedAgent,
      availableBonfires,
      availableAgents,
      loading: {
        bonfires: bonfiresQuery.isLoading,
        agents: agentsQuery.isLoading,
      },
      error: {
        bonfires: bonfiresQuery.error
          ? (bonfiresQuery.error as Error).message
          : undefined,
        agents: agentsQuery.error
          ? (agentsQuery.error as Error).message
          : undefined,
      },
    }),
    [
      selectedBonfire,
      selectedAgent,
      availableBonfires,
      availableAgents,
      bonfiresQuery.isLoading,
      bonfiresQuery.error,
      agentsQuery.isLoading,
      agentsQuery.error,
    ]
  );

  return {
    availableBonfires,
    availableAgents,
    selectedBonfire,
    selectedAgent,
    selectedBonfireId,
    selectedAgentId,
    selectBonfire,
    selectAgent,
    selectionState,
    loading: {
      bonfires: bonfiresQuery.isLoading,
      agents: agentsQuery.isLoading,
    },
    error: {
      bonfires: bonfiresQuery.error
        ? (bonfiresQuery.error as Error).message
        : undefined,
      agents: agentsQuery.error
        ? (agentsQuery.error as Error).message
        : undefined,
    },
    isInitialized: !bonfiresQuery.isLoading && !bonfiresQuery.isPending,
    initializationError: bonfiresQuery.error
      ? (bonfiresQuery.error as Error).message
      : null,
  } as const;
}
