"use client";

/**
 * GraphExplorerPanel
 *
 * Top panel for GraphExplorer: Bonfire + Agent dropdowns (styled like graph-select),
 * search bar in a row below, and episodes list in a vertical column below the panel.
 * Supports collapsed state (icon strip) when a graph is visible; collapse badge is top-left outside the panel.
 * Consumes AgentSelectionContext and GraphExplorerPanelContext (no props).
 */
import Image from "next/image";

import { useGraphSearchHistoryOptional } from "@/components/graph-explorer/graph-context";
import { cn } from "@/lib/cn";

import EpisodesList from "./episodes-list";
import { MobileBottomButtons } from "./mobile-bottom-buttons";
import { PanelHeader } from "./panel-header";
import { useGraphExplorerPanel } from "./panel-context";
import type { GraphExplorerPanelProps } from "./panel-types";
import { border } from "./select-panel-constants";

// Re-export for consumers (e.g. episodes-list)
export { labelClass, panelContainerClass } from "./select-panel-constants";
export type {
  EpisodeTimelineItem,
  GraphExplorerPanelProps,
} from "./panel-types";

export function GraphExplorerPanel({ className }: { className?: string } = {}) {
  const panel = useGraphExplorerPanel();
  const historyCtx = useGraphSearchHistoryOptional();
  const searchHistoryBreadcrumbs = historyCtx?.searchHistoryBreadcrumbs ?? [];
  const activeBreadcrumb = historyCtx?.activeBreadcrumb ?? null;

  const effectiveExpanded = !panel.graphVisible || !panel.isCollapsed;
  const showCollapseBadge = panel.graphVisible && effectiveExpanded;

  return (
    <>
      <div
        className={cn(
          "flex flex-col absolute top-4 left-4 z-50 max-h-[calc(100dvh-10rem)] lg:max-h-[calc(100dvh-7.5rem)] w-full lg:w-fit max-w-[calc(100vw-2rem)]",
          !panel.isRecentActivityCollapsed && "h-full",
          className
        )}
        role="group"
        aria-label="Graph explorer controls"
      >
        {showCollapseBadge && (
          <button
            type="button"
            onClick={() => panel.setIsCollapsed(true)}
            className={cn(
              "z-10 items-center justify-center hidden lg:flex",
              "h-7 rounded-full gap-1 py-2 pl-2 pr-3 w-fit bg-[#22252B]",
              border,
              "hover:bg-[#22252B]/80 transition-colors duration-200"
            )}
            aria-label="Collapse panel"
            title="Collapse panel"
          >
            <Image
              className="rotate-90"
              src="/icons/chevron-down.svg"
              alt=""
              width={12}
              height={12}
            />
            <span className="text-xs font-bold text-white">Collapse</span>
          </button>
        )}

        {effectiveExpanded ? (
          <>
            <div className="relative z-10">
              <PanelHeader />
            </div>

            {!panel.isRecentActivityCollapsed && (
              <div className="relative z-0 min-h-0">
                <EpisodesList />
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => panel.setIsCollapsed(false)}
            className={cn(
              "flex flex-col items-center gap-3 py-4 px-3 rounded-lg min-w-[56px] absolute z-50",
              border,
              " hover:bg-[#22252B]/80 transition-colors duration-200"
            )}
            aria-label="Expand panel"
            title="Expand panel"
          >
            <Image
              src="/icons/collapsed-graph-select.svg"
              alt=""
              width={20}
              height={20}
              className="opacity-80"
            />
          </button>
        )}
      </div>

      <MobileBottomButtons />
    </>
  );
}
