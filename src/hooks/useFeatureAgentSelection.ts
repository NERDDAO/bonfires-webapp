"use client";

import { useCallback, useEffect, useMemo } from "react";

import type { AgentInfo, AgentSelectionState, BonfireInfo } from "@/types";

import { useAgentsQuery, useBonfiresQuery } from "./queries";
import { useLocalStorage } from "./useLocalStorage";

/**
 * Storage keys for different features
 */
export type FeatureStorageKey =
  | "graph"
  | "documents"
  | "chat"
  | "delve"
  | "datarooms";

const STORAGE_KEY_MAP: Record<
  FeatureStorageKey,
  { bonfire: string; agent: string }
> = {
  graph: {
    bonfire: "delve.graph.bonfireId",
    agent: "delve.graph.agentId",
  },
  documents: {
    bonfire: "delve.documents.bonfireId",
    agent: "delve.documents.agentId",
  },
  chat: {
    bonfire: "delve.chat.bonfireId",
    agent: "delve.chat.agentId",
  },
  delve: {
    bonfire: "delve.delve.bonfireId",
    agent: "delve.delve.agentId",
  },
  datarooms: {
    bonfire: "delve.datarooms.bonfireId",
    agent: "delve.datarooms.agentId",
  },
};

interface UseAgentSelectionOptions {
  /** Feature context for localStorage persistence */
  feature: FeatureStorageKey;
  /** Initial bonfire ID (overrides stored value) */
  initialBonfireId?: string | null;
  /** Initial agent ID (overrides stored value) */
  initialAgentId?: string | null;
  /** Whether agent selection is required (true) or optional (false) */
  requireAgent?: boolean;
}

interface UseAgentSelectionReturn {
  /** Current selection state */
  state: AgentSelectionState;
  /** Set selected bonfire (clears agent selection) */
  setBonfire: (bonfireId: string | null) => void;
  /** Set selected agent */
  setAgent: (agentId: string | null) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Whether a valid selection is made */
  isValid: boolean;
}

/**
 * useFeatureAgentSelection Hook
 *
 * Manages bonfire and agent selection with localStorage persistence.
 * Automatically fetches available bonfires and agents.
 *
 * Features:
 * - Per-feature localStorage persistence
 * - Automatic agent list refresh when bonfire changes
 * - Clears agent selection when bonfire changes
 * - Validates selections against available options
 */
export function useFeatureAgentSelection({
  feature,
  initialBonfireId = null,
  initialAgentId = null,
  requireAgent = true,
}: UseAgentSelectionOptions): UseAgentSelectionReturn {
  const storageKeys = STORAGE_KEY_MAP[feature];

  // Persistent storage for selections
  const [storedBonfireId, setStoredBonfireId] = useLocalStorage<string | null>(
    storageKeys.bonfire,
    null
  );
  const [storedAgentId, setStoredAgentId] = useLocalStorage<string | null>(
    storageKeys.agent,
    null
  );

  // Use initial values if provided, otherwise use stored values
  const effectiveBonfireId = initialBonfireId ?? storedBonfireId;
  const effectiveAgentId = initialAgentId ?? storedAgentId;

  // Fetch bonfires
  const {
    data: bonfiresData,
    isLoading: bonfiresLoading,
    error: bonfiresError,
  } = useBonfiresQuery();

  // Fetch agents for selected bonfire
  const {
    data: agentsData,
    isLoading: agentsLoading,
    error: agentsError,
  } = useAgentsQuery({
    bonfireId: effectiveBonfireId,
    enabled: !!effectiveBonfireId,
  });

  // Get available bonfires array
  const availableBonfires: BonfireInfo[] = useMemo(
    () => bonfiresData?.bonfires ?? [],
    [bonfiresData?.bonfires]
  );

  // Get available agents array
  const availableAgents: AgentInfo[] = useMemo(
    () => agentsData?.agents ?? [],
    [agentsData?.agents]
  );

  // Resolve selected bonfire from ID
  const selectedBonfire: BonfireInfo | null = useMemo(() => {
    if (!effectiveBonfireId || availableBonfires.length === 0) return null;
    return availableBonfires.find((b) => b.id === effectiveBonfireId) ?? null;
  }, [effectiveBonfireId, availableBonfires]);

  // Resolve selected agent from ID
  const selectedAgent: AgentInfo | null = useMemo(() => {
    if (!effectiveAgentId || availableAgents.length === 0) return null;
    return availableAgents.find((a) => a.id === effectiveAgentId) ?? null;
  }, [effectiveAgentId, availableAgents]);

  // Validate and clear invalid selections
  useEffect(() => {
    // If stored bonfire doesn't exist in available bonfires, clear it
    if (
      effectiveBonfireId &&
      availableBonfires.length > 0 &&
      !availableBonfires.some((b) => b.id === effectiveBonfireId)
    ) {
      setStoredBonfireId(null);
      setStoredAgentId(null);
    }
  }, [
    effectiveBonfireId,
    availableBonfires,
    setStoredBonfireId,
    setStoredAgentId,
  ]);

  useEffect(() => {
    // If stored agent doesn't exist in available agents, clear it
    if (
      effectiveAgentId &&
      availableAgents.length > 0 &&
      !availableAgents.some((a) => a.id === effectiveAgentId)
    ) {
      setStoredAgentId(null);
    }
  }, [effectiveAgentId, availableAgents, setStoredAgentId]);

  // Handlers
  const setBonfire = useCallback(
    (bonfireId: string | null) => {
      setStoredBonfireId(bonfireId);
      // Clear agent when bonfire changes
      setStoredAgentId(null);
    },
    [setStoredBonfireId, setStoredAgentId]
  );

  const setAgent = useCallback(
    (agentId: string | null) => {
      setStoredAgentId(agentId);
    },
    [setStoredAgentId]
  );

  const clearSelection = useCallback(() => {
    setStoredBonfireId(null);
    setStoredAgentId(null);
  }, [setStoredBonfireId, setStoredAgentId]);

  // Build state object
  const state: AgentSelectionState = useMemo(
    () => ({
      selectedBonfire,
      selectedAgent,
      availableBonfires,
      availableAgents,
      loading: {
        bonfires: bonfiresLoading,
        agents: agentsLoading,
      },
      error: {
        bonfires: bonfiresError?.message,
        agents: agentsError?.message,
      },
    }),
    [
      selectedBonfire,
      selectedAgent,
      availableBonfires,
      availableAgents,
      bonfiresLoading,
      agentsLoading,
      bonfiresError?.message,
      agentsError?.message,
    ]
  );

  // Validation
  const isValid = useMemo(() => {
    if (!selectedBonfire) return false;
    if (requireAgent && !selectedAgent) return false;
    return true;
  }, [selectedBonfire, selectedAgent, requireAgent]);

  return {
    state,
    setBonfire,
    setAgent,
    clearSelection,
    isValid,
  };
}

export default useFeatureAgentSelection;
