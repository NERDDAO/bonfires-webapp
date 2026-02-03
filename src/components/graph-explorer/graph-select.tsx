"use client";

/**
 * GraphSelect
 *
 * Bonfire + agent dropdowns for graph-2. Uses shared graph context for
 * selection state; owns queries and derived data locally.
 * Styled: rounded-2xl/lg:rounded-3xl, bg-[#FFFFFF05], border-[#333333],
 * font-montserrat labels, font-laro-soft body.
 */

import { SelectDropdown } from "@/components/ui/select-dropdown";
import { useGraphContext } from "@/components/graph-explorer/graph-context";
import { useAgentsQuery } from "@/hooks/queries/useAgentsQuery";
import { useBonfiresQuery } from "@/hooks/queries/useBonfiresQuery";
import { cn } from "@/lib/cn";
import type { AgentInfo } from "@/types";
import { useMemo } from "react";

const border = "bg-[#181818]/40 border-[0.78px] border-[#333333]";
const labelClass =
  "font-montserrat text-sm lg:text-base font-bold text-white mb-2";
const skeletonClass =
  `${border} rounded-2xl w-full px-4 lg:px-5 py-4 h-12 animate-pulse`;
const errorClass =
  `${border} rounded-2xl w-full px-4 lg:px-5 py-4 text-sm text-red-400`;
const contentClass = "bg-[#0f0f0f] border-[#333333]";

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

export default function GraphSelect() {
  const {
    selectedBonfireId,
    selectedAgentId,
    selectBonfire,
    selectAgent,
  } = useGraphContext();

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

  const loading = {
    bonfires: bonfiresQuery.isLoading,
    agents: agentsQuery.isLoading,
  };
  const error = {
    bonfires: bonfiresQuery.error
      ? (bonfiresQuery.error as Error).message
      : undefined,
    agents: agentsQuery.error
      ? (agentsQuery.error as Error).message
      : undefined,
  };

  return (
    <div className="absolute top-4 left-4 w-full max-w-md z-10">
      <div
        className={cn(
          "flex gap-4 w-full",
          border,
          "rounded-2xl w-full px-4 lg:px-5 py-4"
        )}
        role="group"
        aria-label="Bonfire and agent selection"
      >
        {/* Bonfire */}
        <div className="flex-1 flex flex-col">
          <label htmlFor="bonfire-select" className={labelClass}>
            Bonfire
          </label>
          {loading.bonfires ? (
            <div className={skeletonClass} aria-hidden />
          ) : error.bonfires ? (
            <div className={errorClass} role="alert">
              {error.bonfires}
            </div>
          ) : (
            <SelectDropdown
              id="bonfire-select"
              value={selectedBonfire?.id ?? null}
              options={availableBonfires.map((b) => ({
                value: b.id,
                label: b.name,
              }))}
              placeholder="Select a bonfire"
              onChange={selectBonfire}
              aria-label="Select bonfire"
              contentClassName={contentClass}
            />
          )}
        </div>

        {/* Agent */}
        <div className="flex-1 flex flex-col">
          <label htmlFor="agent-select" className={labelClass}>
            Agent
          </label>
          {loading.agents ? (
            <div className={skeletonClass} aria-hidden />
          ) : error.agents ? (
            <div className={errorClass} role="alert">
              {error.agents}
            </div>
          ) : (
            <SelectDropdown
              id="agent-select"
              value={selectedAgent?.id ?? null}
              options={availableAgents.map((a) => ({
                value: a.id,
                label: a.name || a.username || a.id,
              }))}
              placeholder={
                !selectedBonfire
                  ? "Select a bonfire first"
                  : availableAgents.length === 0
                    ? "No agents available"
                    : "Select an agent"
              }
              onChange={selectAgent}
              disabled={!selectedBonfire || availableAgents.length === 0}
              aria-label="Select agent"
              contentClassName={contentClass}
            />
          )}
        </div>
      </div>
    </div>
  );
}
