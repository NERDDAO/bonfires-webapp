"use client";

/**
 * Graph context for graph-2: shares bonfire/agent selection state and setters
 * so GraphSelect and other graph-2 components can read/update selection.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface GraphContextValue {
  selectedBonfireId: string | null;
  selectedAgentId: string | null;
  selectBonfire: (bonfireId: string | null) => void;
  selectAgent: (agentId: string | null) => void;
}

const GraphContext = createContext<GraphContextValue | null>(null);

export function GraphProvider({
  children,
  initialBonfireId = null,
  initialAgentId = null,
}: {
  children: ReactNode;
  initialBonfireId?: string | null;
  initialAgentId?: string | null;
}) {
  const [selectedBonfireId, setSelectedBonfireId] = useState<string | null>(
    initialBonfireId
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    initialAgentId
  );

  const selectBonfire = useCallback((bonfireId: string | null) => {
    setSelectedBonfireId(bonfireId);
    setSelectedAgentId(null);
  }, []);

  const selectAgent = useCallback((agentId: string | null) => {
    setSelectedAgentId(agentId);
  }, []);

  const value = useMemo<GraphContextValue>(
    () => ({
      selectedBonfireId,
      selectedAgentId,
      selectBonfire,
      selectAgent,
    }),
    [selectedBonfireId, selectedAgentId, selectBonfire, selectAgent]
  );

  return (
    <GraphContext.Provider value={value}>{children}</GraphContext.Provider>
  );
}

export function useGraphContext(): GraphContextValue {
  const ctx = useContext(GraphContext);
  if (!ctx) {
    throw new Error("useGraphContext must be within GraphProvider");
  }
  return ctx;
}
