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

import { cn } from "@/lib/cn";

import EpisodesList from "./episodes-list";
import { MobileBottomButtons } from "./mobile-bottom-buttons";
import { PanelHeader } from "./panel-header";
import { useGraphExplorerPanel } from "./panel-context";

import { border } from "./select-panel-constants";

// Re-export for consumers (e.g. episodes-list)
export { labelClass, panelContainerClass } from "./select-panel-constants";
export type {
  EpisodeTimelineItem,
  GraphExplorerPanelProps,
} from "./panel-types";

export function GraphExplorerPanel({ className }: { className?: string } = {}) {
  const panel = useGraphExplorerPanel();

  const effectiveExpanded = !panel.graphVisible || !panel.isCollapsed;
  const showCollapseBadge = panel.graphVisible && effectiveExpanded;

  return (
    <>
      {/* Floating panel — like the chat box but top-left */}
      <div
        className={cn(
          "fixed top-20 left-4 z-30",
          "flex flex-col overflow-hidden",
          border,
          "shadow-xl",
          effectiveExpanded
            ? "w-[calc(100vw-2rem)] lg:w-96 h-[calc(100dvh-7rem)] lg:h-[600px]"
            : "w-12 h-12",
          "transition-all duration-200",
          className,
        )}
        role="group"
        aria-label="Graph explorer controls"
      >
        {effectiveExpanded ? (
          <>
            <div className="flex items-center justify-between p-3 border-b border-[#333333] shrink-0">
              <span className="font-montserrat text-sm font-bold text-white uppercase tracking-wider">
                Explorer
              </span>
              {showCollapseBadge && (
                <button
                  type="button"
                  onClick={() => panel.setIsCollapsed(true)}
                  className="text-xs text-white/60 hover:text-white transition-colors"
                  aria-label="Collapse panel"
                >
                  —
                </button>
              )}
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="relative z-10">
                <PanelHeader />
              </div>
              {!panel.isRecentActivityCollapsed && (
                <div className="relative z-0 min-h-0 flex-1 overflow-hidden">
                  <EpisodesList />
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => panel.setIsCollapsed(false)}
            className="w-full h-full flex items-center justify-center hover:bg-[#22252B]/80 transition-colors"
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
