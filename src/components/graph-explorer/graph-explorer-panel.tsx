"use client";

/**
 * GraphExplorerPanel
 *
 * Top panel for GraphExplorer: Bonfire + Agent dropdowns (styled like graph-select)
 * and stacked Search / Episodes icon buttons.
 */

import { SelectDropdown } from "@/components/ui/select-dropdown";
import { cn } from "@/lib/cn";
import type { AgentInfo, BonfireInfo } from "@/types";
import Image from "next/image";
import { IconButton } from "./ui/icon-button";

const width = "w-50";
const border = "bg-[#181818]/80 border-[0.78px] border-[#333333]";
const labelClass =
  "font-montserrat text-sm lg:text-base font-bold text-white mb-2";
const skeletonClass =
  `${border} rounded-2xl ${width} px-4 lg:px-5 py-4 h-12 animate-pulse`;
const errorClass =
  `${border} rounded-2xl ${width} px-4 lg:px-5 py-4 text-sm text-red-400`;
const contentClass = "bg-[#0f0f0f] border-[#333333]";

export interface GraphExplorerPanelProps {
  availableBonfires: BonfireInfo[];
  availableAgents: AgentInfo[];
  selectedBonfireId: string | null;
  selectedAgentId: string | null;
  loading: { bonfires: boolean; agents: boolean };
  error: { bonfires?: string; agents?: string };
  onSelectBonfire: (id: string | null) => void;
  onSelectAgent: (id: string | null) => void;
  onOpenSearch: () => void;
  onOpenEpisodes: () => void;
  className?: string;
}

export function GraphExplorerPanel({
  availableBonfires,
  availableAgents,
  selectedBonfireId,
  selectedAgentId,
  loading,
  error,
  onSelectBonfire,
  onSelectAgent,
  onOpenSearch,
  onOpenEpisodes,
  className,
}: GraphExplorerPanelProps) {
  const selectedBonfire =
    availableBonfires.find((b) => b.id === selectedBonfireId) ?? null;
  const selectedAgent =
    availableAgents.find((a) => a.id === selectedAgentId) ?? null;

  return (
    <header
      className={cn(
        "flex items-center justify-between absolute top-4 left-4 z-50",
        className
      )}
    >

      <div
        className={cn(
          "flex gap-4 flex-1",
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
              onChange={onSelectBonfire}
              aria-label="Select bonfire"
              className={width}
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
                !selectedBonfireId
                  ? "Select a bonfire first"
                  : availableAgents.length === 0
                    ? "No agents available"
                    : "Select an agent"
              }
              onChange={onSelectAgent}
              disabled={!selectedBonfireId || availableAgents.length === 0}
              aria-label="Select agent"
              className={width}
              contentClassName={contentClass}
            />
          )}
        </div>

        <div
          className="flex flex-col gap-1 shrink-0 rounded-md border border-neutral-700 bg-neutral-900/90 p-1 shadow-md ml-2"
          role="group"
          aria-label="Search and episodes"
        >
          <IconButton
            onClick={onOpenSearch}
            aria-label="Search"
            title="Search graph"
          >
            <Image
              src="/icons/search.svg"
              alt=""
              width={16}
              height={16}
              className="w-3 h-3"
            />
          </IconButton>
          <IconButton
            onClick={onOpenEpisodes}
            aria-label="Episodes"
            title="Episodes"
          >
            <Image
              src="/icons/hamburger.svg"
              alt=""
              width={16}
              height={16}
              className="w-3 h-3"
            />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
