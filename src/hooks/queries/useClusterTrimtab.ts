"use client";

/**
 * useClusterTrimtab Hook
 *
 * Resolves a cluster into its constituent agents and polls each agent's
 * trimtab data on a 5-second interval. Produces a merged, filterable
 * feed of notes across all active agents in the cluster.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrimtabNote {
  id?: string;
  noteId?: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  agentId?: string;
  agentName?: string;
}

export interface TrimtabData {
  agentId: string;
  agentName: string;
  notes: TrimtabNote[];
  quests: unknown[];
  tasks: unknown[];
  friends: unknown[];
  updatedAt?: string;
  createdAt?: string;
}

interface ClusterInfo {
  id: string;
  name: string;
  bonfire_ids: string[];
  indexing_agent_id: string;
  owner_bonfire_id: string;
}

interface BonfireAgentsResponse {
  agents: Array<{
    id: string;
    name: string;
    is_active: boolean;
    bonfire_id: string;
  }>;
  total_agents: number;
  active_agents: number;
}

export interface ClusterAgent {
  agentId: string;
  agentName: string;
  bonfireId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL = 5000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useClusterTrimtab(clusterId: string | null) {
  // --- State ---
  const [clusterName, setClusterName] = useState<string | null>(null);
  const [agents, setAgents] = useState<ClusterAgent[]>([]);
  const [enabledAgentIds, setEnabledAgentIds] = useState<Set<string>>(
    new Set(),
  );
  const [agentData, setAgentData] = useState<Map<string, TrimtabData>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track last-fetched timestamps per agent for incremental polling
  const sinceRef = useRef<Map<string, string>>(new Map());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -----------------------------------------------------------------------
  // Resolution phase — runs once per clusterId change
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!clusterId) {
      setClusterName(null);
      setAgents([]);
      setEnabledAgentIds(new Set());
      setAgentData(new Map());
      setError(null);
      sinceRef.current.clear();
      return;
    }

    let cancelled = false;

    async function resolve() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch cluster details
        const clusterRes = await fetch(`/api/clusters/${clusterId}`);
        if (cancelled) return;
        if (!clusterRes.ok) {
          setError(`Failed to load cluster: ${clusterRes.status}`);
          setIsLoading(false);
          return;
        }

        const cluster: ClusterInfo = await clusterRes.json();
        if (cancelled) return;

        setClusterName(cluster.name);

        // 2. For each bonfire, fetch agents and pick first active one
        const resolvedAgents: ClusterAgent[] = [];

        const agentFetches = cluster.bonfire_ids.map(async (bonfireId) => {
          try {
            const res = await fetch(`/api/bonfires/${bonfireId}/agents`);
            if (!res.ok) return null;
            const data: BonfireAgentsResponse = await res.json();
            const active = data.agents.find((a) => a.is_active);
            if (active) {
              return {
                agentId: active.id,
                agentName: active.name,
                bonfireId,
              } satisfies ClusterAgent;
            }
            return null;
          } catch {
            // Skip bonfires that fail to resolve
            return null;
          }
        });

        const results = await Promise.all(agentFetches);
        if (cancelled) return;

        for (const agent of results) {
          if (agent) resolvedAgents.push(agent);
        }

        setAgents(resolvedAgents);
        setEnabledAgentIds(new Set(resolvedAgents.map((a) => a.agentId)));
        sinceRef.current.clear();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to resolve cluster",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    resolve();

    return () => {
      cancelled = true;
    };
  }, [clusterId]);

  // -----------------------------------------------------------------------
  // Polling phase — runs every 5s once agents are resolved
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (agents.length === 0) return;

    async function pollAll() {
      const nextData = new Map(agentData);
      let changed = false;

      const fetches = agents.map(async (agent) => {
        try {
          const since = sinceRef.current.get(agent.agentId);
          const url = since
            ? `/api/trimtab/${agent.agentId}?since=${encodeURIComponent(since)}`
            : `/api/trimtab/${agent.agentId}`;

          const res = await fetch(url);
          if (!res.ok) return;

          const data: TrimtabData = await res.json();

          // Tag every note with source agent info
          const taggedNotes = data.notes.map((note) => ({
            ...note,
            agentId: agent.agentId,
            agentName: agent.agentName,
          }));

          const existing = nextData.get(agent.agentId);

          if (since && existing) {
            // Incremental: merge new notes into existing data
            const existingIds = new Set(
              existing.notes.map((n) => n.id ?? n.noteId),
            );
            const newNotes = taggedNotes.filter(
              (n) => !existingIds.has(n.id ?? n.noteId),
            );
            if (newNotes.length > 0) {
              nextData.set(agent.agentId, {
                ...data,
                notes: [...existing.notes, ...newNotes],
              });
              changed = true;
            }
          } else {
            // Full load
            nextData.set(agent.agentId, { ...data, notes: taggedNotes });
            changed = true;
          }

          // Track the latest note timestamp for incremental polling
          if (data.updatedAt) {
            sinceRef.current.set(agent.agentId, data.updatedAt);
          }
        } catch {
          // Individual agent failures don't break the feed
        }
      });

      await Promise.all(fetches);

      if (changed) {
        setAgentData(new Map(nextData));
      }
    }

    // Initial fetch immediately
    pollAll();

    pollingRef.current = setInterval(pollAll, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // agentData intentionally excluded — we read it inside pollAll via closure
    // over the Map reference and only use setAgentData for writes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents]);

  // -----------------------------------------------------------------------
  // Toggle an agent's visibility in the merged feed
  // -----------------------------------------------------------------------

  const toggleAgent = useCallback((id: string) => {
    setEnabledAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // -----------------------------------------------------------------------
  // Merged notes — collect from enabled agents, sort newest first
  // -----------------------------------------------------------------------

  const mergedNotes = useMemo(() => {
    const allNotes: TrimtabNote[] = [];

    for (const [agentId, data] of agentData) {
      if (!enabledAgentIds.has(agentId)) continue;
      allNotes.push(...data.notes);
    }

    allNotes.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return allNotes;
  }, [agentData, enabledAgentIds]);

  // -----------------------------------------------------------------------
  // Return
  // -----------------------------------------------------------------------

  return {
    clusterName,
    agents,
    enabledAgentIds,
    toggleAgent,
    agentData,
    mergedNotes,
    isLoading,
    error,
  };
}
