"use client";

/**
 * Graph explorer panel context.
 * Provides search, episodes, visibility, and panel UI state so the panel
 * and its children (PanelHeader, EpisodesList, MobileBottomButtons) consume
 * via context instead of prop drilling.
 */
import React, { createContext, useContext, useMemo, useState } from "react";

import type { EpisodeTimelineItem } from "./panel-types";

export interface GraphExplorerPanelContextValue {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  episodes: EpisodeTimelineItem[];
  selectedEpisodeId: string | null;
  onEpisodeSelect: (episodeUuid: string) => void;
  episodesLoading: boolean;
  graphVisible: boolean;
  hideGraphSelector: boolean;
  onOpenChat?: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  isRecentActivityCollapsed: boolean;
  setIsRecentActivityCollapsed: (
    value: boolean | ((prev: boolean) => boolean)
  ) => void;
}

const GraphExplorerPanelContext =
  createContext<GraphExplorerPanelContextValue | null>(null);

export interface GraphExplorerPanelProviderProps {
  children: React.ReactNode;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  isSearching?: boolean;
  episodes: EpisodeTimelineItem[];
  selectedEpisodeId: string | null;
  onEpisodeSelect: (episodeUuid: string) => void;
  episodesLoading?: boolean;
  graphVisible?: boolean;
  hideGraphSelector?: boolean;
  onOpenChat?: () => void;
}

export function GraphExplorerPanelProvider({
  children,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isSearching = false,
  episodes,
  selectedEpisodeId,
  onEpisodeSelect,
  episodesLoading = false,
  graphVisible = true,
  hideGraphSelector = false,
  onOpenChat,
}: GraphExplorerPanelProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRecentActivityCollapsed, setIsRecentActivityCollapsed] =
    useState(false);

  const value = useMemo<GraphExplorerPanelContextValue>(
    () => ({
      searchQuery,
      onSearchQueryChange,
      onSearch,
      isSearching,
      episodes,
      selectedEpisodeId,
      onEpisodeSelect,
      episodesLoading,
      graphVisible,
      hideGraphSelector,
      onOpenChat,
      isCollapsed,
      setIsCollapsed,
      isRecentActivityCollapsed,
      setIsRecentActivityCollapsed,
    }),
    [
      searchQuery,
      onSearchQueryChange,
      onSearch,
      isSearching,
      episodes,
      selectedEpisodeId,
      onEpisodeSelect,
      episodesLoading,
      graphVisible,
      hideGraphSelector,
      onOpenChat,
      isCollapsed,
      isRecentActivityCollapsed,
    ]
  );

  return (
    <GraphExplorerPanelContext.Provider value={value}>
      {children}
    </GraphExplorerPanelContext.Provider>
  );
}

export function useGraphExplorerPanel(): GraphExplorerPanelContextValue {
  const ctx = useContext(GraphExplorerPanelContext);
  if (!ctx) {
    throw new Error(
      "useGraphExplorerPanel must be used within GraphExplorerPanelProvider"
    );
  }
  return ctx;
}

export function useGraphExplorerPanelOptional(): GraphExplorerPanelContextValue | null {
  return useContext(GraphExplorerPanelContext);
}
