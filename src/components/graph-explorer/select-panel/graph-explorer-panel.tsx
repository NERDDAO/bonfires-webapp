"use client";

/**
 * GraphExplorerPanel
 *
 * Top panel for GraphExplorer: Bonfire + Agent dropdowns (styled like graph-select),
 * search bar in a row below, and episodes list in a vertical column below the panel.
 * Supports collapsed state (icon strip) when a graph is visible; collapse badge is top-left outside the panel.
 */

import { useState } from "react";
import { SelectDropdown } from "@/components/ui/select-dropdown";
import { cn } from "@/lib/cn";
import type { AgentInfo, BonfireInfo } from "@/types";
import EpisodesList from "./episodes-list";
import Image from "next/image";
import Link from "next/link";

const width = "w-full lg:w-50";
const border = "bg-[#181818]/80 border-[0.78px] border-[#333333]";
const skeletonClass =
  `${border} rounded-2xl ${width} px-4 lg:px-5 py-4 h-12 animate-pulse`;
const errorClass =
  `${border} rounded-2xl ${width} px-4 lg:px-5 py-4 text-sm text-red-400`;
const contentClass = "bg-[#0f0f0f] border-[#333333]";

export const labelClass = "font-montserrat text-sm lg:text-base font-bold text-white mb-2";
export const panelContainerClass = cn(
  "flex flex-col gap-3",
  border,
  "rounded-2xl w-full max-w-full lg:w-[468px] px-4 lg:px-5 py-4"
)

export interface EpisodeTimelineItem {
  uuid: string;
  name?: string;
  valid_at?: string;
  content?: string;
}

export interface GraphExplorerPanelProps {
  availableBonfires: BonfireInfo[];
  availableAgents: AgentInfo[];
  selectedBonfireId: string | null;
  selectedAgentId: string | null;
  loading: { bonfires: boolean; agents: boolean };
  error: { bonfires?: string; agents?: string };
  onSelectBonfire: (id: string | null) => void;
  onSelectAgent: (id: string | null) => void;
  /** Search bar (inline in panel) */
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  isSearching?: boolean;
  /** Episodes list (vertical column below panel) */
  episodes: EpisodeTimelineItem[];
  selectedEpisodeId: string | null;
  onEpisodeSelect: (episodeUuid: string) => void;
  episodesLoading?: boolean;
  /** When false, panel stays expanded (no collapse). Default true. */
  graphVisible?: boolean;
  className?: string;
  /** Telegram bot username */
  telegramBotUsername: string;
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
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isSearching = false,
  episodes,
  selectedEpisodeId,
  onEpisodeSelect,
  episodesLoading = false,
  graphVisible = true,
  className,
  telegramBotUsername,
}: GraphExplorerPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRecentActivityCollapsed, setIsRecentActivityCollapsed] = useState(false);
  const effectiveExpanded = !graphVisible || !isCollapsed;
  const showCollapseBadge = graphVisible && effectiveExpanded;

  const selectedBonfire =
    availableBonfires.find((b) => b.id === selectedBonfireId) ?? null;
  const selectedAgent =
    availableAgents.find((a) => a.id === selectedAgentId) ?? null;

  const hasSearchText = searchQuery.trim().length > 0;

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") onSearch();
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col absolute top-4 left-4 z-50 max-h-[calc(100vh-10rem)] lg:max-h-[calc(100vh-2rem)] w-full lg:w-fit max-w-[calc(100vw-2rem)]",
          !isRecentActivityCollapsed && "h-full",
          className
        )}
        role="group"
        aria-label="Graph explorer controls"
      >
        {/* Collapse badge: top-left outside the panel (only when expanded and graph visible) */}
        {showCollapseBadge && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className={cn(
              "z-10 items-center justify-center hidden lg:flex",
              "h-7 rounded-full gap-1 px-2 w-fit",
              border
            )}
            aria-label="Collapse panel"
            title="Collapse panel"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>

            <span className="text-sm text-white">Collapse</span>
          </button>
        )}

        {effectiveExpanded ? (
          <>
            {/* Panel: dropdowns + search row */}
            <header
              className={cn(panelContainerClass, "mb-3 lg:mt-2")}
              aria-label="Bonfire, agent and search"
            >
              <div className="flex gap-4 flex-1 flex-col lg:flex-row">
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
              </div>

              {/* Search bar row */}
              <div className="flex flex-col relative mt-2">
                <label htmlFor="search-input" className={labelClass}>
                  Search the graph
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Enter search query"
                  className={cn(
                    "flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm lg:text-base",
                    "bg-[#181818] border border-[#333333] text-white",
                    "placeholder:text-[#A9A9A9]",
                    "focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-[#646464]"
                  )}
                  aria-label="Search query"
                />
                {hasSearchText && (
                  <button
                    type="button"
                    onClick={onSearch}
                    disabled={isSearching}
                    className={cn(
                      "p-1.5 rounded-md text-sm font-medium shrink-0",
                      "bg-primary text-primary-content absolute right-2 bottom-2 flex items-center justify-center",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    )}
                    aria-label="Search"
                  >
                    <Image
                      src={isSearching ? "/icons/loader-circle.svg" : "/icons/search.svg"}
                      alt={isSearching ? "Searching" : "Search"}
                      width={16}
                      height={16}
                      className={cn(isSearching && "animate-spin")}
                    />
                  </button>
                )}
              </div>
            </header>

            {!isRecentActivityCollapsed && (
              <EpisodesList
                episodes={episodes}
                selectedEpisodeId={selectedEpisodeId}
                onEpisodeSelect={onEpisodeSelect}
                episodesLoading={episodesLoading}
              />
            )}
          </>
        ) : (
          /* Collapsed: icon strip (search + hamburger), click anywhere to expand */
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className={cn(
              "flex flex-col items-center gap-3 py-4 px-3 rounded-lg min-w-[56px] absolute z-50",
              border,
            )}
            aria-label="Expand panel"
            title="Expand panel"
          >
            <Image src="/icons/collapsed-graph-select.svg" alt="" width={20} height={20} className="opacity-80" />
          </button>
        )}
      </div>

      {/* Extra button(s) for recent activity collapse/expand only (separate from panel collapse) */}
      <div className="absolute bottom-0 h-10 z-50 flex lg:hidden mb-2 w-full px-4 gap-2">
        <button
          type="button"
          onClick={() => setIsRecentActivityCollapsed((prev) => !prev)}
          className={cn(
            "flex-1 flex items-center justify-center px-2.5 py-1.5 rounded-lg text-sm font-medium",
            border,
            "bg-[#1C1D21]",
          )}
        >
          {isRecentActivityCollapsed ? "Recent activity" : "Hide activity"}
        </button>

        <Link
          href={`https://t.me/${telegramBotUsername}`}
          target="_blank"
          className={cn(
            "flex-1 flex items-center justify-center px-2.5 py-1.5 rounded-lg text-sm font-medium",
            border,
            "bg-[#1C1D21]",
          )}
        >
          Chat in TG
        </Link>
      </div>
    </>
  );
}
