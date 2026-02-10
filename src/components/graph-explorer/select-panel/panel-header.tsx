"use client";

import Image from "next/image";

import type { AgentInfo, BonfireInfo } from "@/types";

import { SelectDropdown } from "@/components/ui/select-dropdown";

import { cn } from "@/lib/cn";

import { SearchHistoryBreadcrumbs } from "./search-history-breadcrumbs";
import {
  contentClass,
  errorClass,
  labelClass,
  panelContainerClass,
  skeletonClass,
  width,
} from "./select-panel-constants";

export interface PanelHeaderProps {
  hideGraphSelector: boolean;
  loading: { bonfires: boolean; agents: boolean };
  error: { bonfires?: string; agents?: string };
  availableBonfires: BonfireInfo[];
  availableAgents: AgentInfo[];
  selectedBonfireId: string | null;
  selectedAgentId: string | null;
  onSelectBonfire: (id: string | null) => void;
  onSelectAgent: (id: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  searchHistoryBreadcrumbs: { label: string; onClick: () => void }[];
  /** Label of the currently active breadcrumb (from search history). When provided, used for highlighting. */
  activeBreadcrumb?: string | null;
}

export function PanelHeader({
  hideGraphSelector,
  loading,
  error,
  availableBonfires,
  availableAgents,
  selectedBonfireId,
  selectedAgentId,
  onSelectBonfire,
  onSelectAgent,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isSearching,
  searchHistoryBreadcrumbs,
  activeBreadcrumb: activeBreadcrumbProp,
}: PanelHeaderProps) {
  const selectedBonfire =
    availableBonfires.find((b) => b.id === selectedBonfireId) ?? null;
  const selectedAgent =
    availableAgents.find((a) => a.id === selectedAgentId) ?? null;
  const hasSearchText = searchQuery.trim().length > 0;

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") onSearch();
  }

  const activeBreadcrumb =
    activeBreadcrumbProp ??
    searchHistoryBreadcrumbs.find((crumb) => crumb.label === searchQuery)
      ?.label ??
    null;

  return (
    <>
      <header
        className={cn(panelContainerClass, "mb-3 lg:mb-0 lg:mt-2")}
        aria-label={hideGraphSelector ? "Search" : "Bonfire, agent and search"}
      >
        {!hideGraphSelector && (
          <div className="flex gap-4 flex-1 flex-col lg:flex-row mb-2">
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
        )}

        <div className="flex flex-col relative">
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
              "flex-1 min-w-0 px-3 py-2.5 rounded-xl text-base",
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
                src={
                  isSearching ? "/icons/loader-circle.svg" : "/icons/search.svg"
                }
                alt={isSearching ? "Searching" : "Search"}
                width={16}
                height={16}
                className={cn(isSearching && "animate-spin")}
              />
            </button>
          )}
        </div>

        <div className="block lg:hidden">
          <SearchHistoryBreadcrumbs
            breadcrumbs={searchHistoryBreadcrumbs}
            activeBreadcrumb={activeBreadcrumb}
          />
        </div>
      </header>

      {searchHistoryBreadcrumbs.length > 0 && (
        <div className={cn(panelContainerClass, "lg:mt-3 hidden lg:block")}>
          <label
            htmlFor="search-history-breadcrumbs"
            className={cn(labelClass, "mb-0")}
          >
            Graph Navigation
          </label>
          <SearchHistoryBreadcrumbs
            breadcrumbs={searchHistoryBreadcrumbs}
            activeBreadcrumb={activeBreadcrumb}
          />
        </div>
      )}
    </>
  );
}
