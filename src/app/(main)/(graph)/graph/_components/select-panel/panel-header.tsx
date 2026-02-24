"use client";

import Image from "next/image";

import { useAgentSelectionContext } from "@/app/(main)/(graph)/graph/_contexts/agent-selection-context";
import { useGraphSearchHistoryOptional } from "@/app/(main)/(graph)/graph/_contexts/graph-context";
import { SelectDropdown } from "@/components/ui/select-dropdown";
import { cn } from "@/lib/cn";

import { useGraphExplorerPanel } from "./panel-context";
import { SearchHistoryBreadcrumbs } from "./search-history-breadcrumbs";
import {
  contentClass,
  errorClass,
  labelClass,
  panelContainerClass,
  skeletonClass,
  width,
} from "./select-panel-constants";

export function PanelHeader() {
  const agentSelection = useAgentSelectionContext();
  const panel = useGraphExplorerPanel();
  const historyCtx = useGraphSearchHistoryOptional();
  const searchHistoryBreadcrumbs = historyCtx?.searchHistoryBreadcrumbs ?? [];
  const activeBreadcrumbProp = historyCtx?.activeBreadcrumb ?? null;

  const selectedBonfire =
    agentSelection.availableBonfires.find(
      (b) => b.id === agentSelection.selectedBonfireId
    ) ?? null;
  const selectedAgent =
    agentSelection.availableAgents.find(
      (a) => a.id === agentSelection.selectedAgentId
    ) ?? null;
  const hasSearchText = panel.searchQuery.trim().length > 0;

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") panel.onSearch();
  }

  const activeBreadcrumb =
    activeBreadcrumbProp ??
    searchHistoryBreadcrumbs.find((crumb) => crumb.label === panel.searchQuery)
      ?.label ??
    null;

  return (
    <>
      <header
        className={cn(panelContainerClass, "mb-3 lg:mb-0 lg:mt-2")}
        aria-label={
          panel.hideGraphSelector ? "Search" : "Bonfire, agent and search"
        }
      >
        {!panel.hideGraphSelector && (
          <div className="flex gap-4 flex-1 flex-col lg:flex-row mb-2">
            <div className="flex-1 flex flex-col">
              <label htmlFor="bonfire-select" className={labelClass}>
                Bonfire
              </label>
              {agentSelection.loading.bonfires ? (
                <div className={skeletonClass} aria-hidden />
              ) : agentSelection.error.bonfires ? (
                <div className={errorClass} role="alert">
                  {agentSelection.error.bonfires}
                </div>
              ) : (
                <SelectDropdown
                  id="bonfire-select"
                  value={selectedBonfire?.id ?? null}
                  options={agentSelection.availableBonfires.map((b) => ({
                    value: b.id,
                    label: b.name,
                  }))}
                  placeholder="Select a bonfire"
                  onChange={agentSelection.selectBonfire}
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
              {agentSelection.loading.agents ? (
                <div className={skeletonClass} aria-hidden />
              ) : selectedBonfire?.id && agentSelection.error.agents ? (
                <div className={errorClass} role="alert">
                  {agentSelection.error.agents}
                </div>
              ) : (
                <SelectDropdown
                  id="agent-select"
                  value={selectedAgent?.id ?? null}
                  options={agentSelection.availableAgents.map((a) => ({
                    value: a.id,
                    label: a.name || a.username || a.id,
                  }))}
                  placeholder={
                    !agentSelection.selectedBonfireId
                      ? "Select a bonfire first"
                      : agentSelection.availableAgents.length === 0
                        ? "No agents available"
                        : "Select an agent"
                  }
                  onChange={agentSelection.selectAgent}
                  disabled={
                    !agentSelection.selectedBonfireId ||
                    agentSelection.availableAgents.length === 0
                  }
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
            value={panel.searchQuery}
            onChange={(e) => panel.onSearchQueryChange(e.target.value)}
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
              onClick={panel.onSearch}
              disabled={panel.isSearching}
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
                  panel.isSearching
                    ? "/icons/loader-circle.svg"
                    : "/icons/search.svg"
                }
                alt={panel.isSearching ? "Searching" : "Search"}
                width={16}
                height={16}
                className={cn(panel.isSearching && "animate-spin")}
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
