"use client";

/**
 * Agent selection context for GraphExplorer.
 * Provides bonfire/agent lists, selection state, and actions so the panel
 * and other children consume via context instead of prop drilling.
 */
import React, { createContext, useContext, useMemo } from "react";

import { useAgentSelection } from "@/hooks";

export interface AgentSelectionContextValue {
  availableBonfires: ReturnType<typeof useAgentSelection>["availableBonfires"];
  availableAgents: ReturnType<typeof useAgentSelection>["availableAgents"];
  selectedBonfireId: string | null;
  selectedAgentId: string | null;
  selectedBonfire: ReturnType<typeof useAgentSelection>["selectedBonfire"];
  selectedAgent: ReturnType<typeof useAgentSelection>["selectedAgent"];
  loading: { bonfires: boolean; agents: boolean };
  error: { bonfires?: string; agents?: string };
  isInitialized: boolean;
  selectBonfire: (id: string | null) => void;
  selectAgent: (id: string | null) => void;
}

const AgentSelectionContext =
  createContext<AgentSelectionContextValue | null>(null);

export interface AgentSelectionProviderProps {
  children: React.ReactNode;
  initialBonfireId?: string | null;
  initialAgentId?: string | null;
  forceInitialSelection?: boolean;
}

export function AgentSelectionProvider({
  children,
  initialBonfireId,
  initialAgentId,
  forceInitialSelection = false,
}: AgentSelectionProviderProps) {
  const agentSelection = useAgentSelection({
    initialBonfireId: initialBonfireId ?? undefined,
    initialAgentId: initialAgentId ?? undefined,
    forceInitialSelection,
  });

  const value = useMemo<AgentSelectionContextValue>(
    () => ({
      availableBonfires: agentSelection.availableBonfires,
      availableAgents: agentSelection.availableAgents,
      selectedBonfireId: agentSelection.selectedBonfireId,
      selectedAgentId: agentSelection.selectedAgentId,
      selectedBonfire: agentSelection.selectedBonfire,
      selectedAgent: agentSelection.selectedAgent,
      loading: agentSelection.loading,
      error: agentSelection.error,
      isInitialized: agentSelection.isInitialized,
      selectBonfire: agentSelection.selectBonfire,
      selectAgent: agentSelection.selectAgent,
    }),
    [
      agentSelection.availableBonfires,
      agentSelection.availableAgents,
      agentSelection.selectedBonfireId,
      agentSelection.selectedAgentId,
      agentSelection.selectedBonfire,
      agentSelection.selectedAgent,
      agentSelection.loading,
      agentSelection.error,
      agentSelection.isInitialized,
      agentSelection.selectBonfire,
      agentSelection.selectAgent,
    ]
  );

  return (
    <AgentSelectionContext.Provider value={value}>
      {children}
    </AgentSelectionContext.Provider>
  );
}

export function useAgentSelectionContext(): AgentSelectionContextValue {
  const ctx = useContext(AgentSelectionContext);
  if (!ctx) {
    throw new Error(
      "useAgentSelectionContext must be used within AgentSelectionProvider"
    );
  }
  return ctx;
}

export function useAgentSelectionContextOptional(): AgentSelectionContextValue | null {
  return useContext(AgentSelectionContext);
}
