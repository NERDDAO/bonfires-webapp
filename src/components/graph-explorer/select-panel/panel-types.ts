import type { AgentInfo, BonfireInfo } from "@/types";

/**
 * Shared types for the graph-explorer select panel.
 */

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
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  isSearching?: boolean;
  searchHistoryBreadcrumbs?: { label: string; onClick: () => void }[];
  /** Label of the currently active breadcrumb (from search history currentIndex). */
  activeBreadcrumb?: string | null;
  episodes: EpisodeTimelineItem[];
  selectedEpisodeId: string | null;
  onEpisodeSelect: (episodeUuid: string) => void;
  episodesLoading?: boolean;
  graphVisible?: boolean;
  hideGraphSelector?: boolean;
  className?: string;
  onOpenChat?: () => void;
}
