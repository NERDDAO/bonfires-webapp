"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";

import {
  SelectionActionType,
  useGraphExpand,
  useGraphExplorerState,
  useGraphQuery,
} from "@/hooks";
import type { AgentLatestEpisodesResponse, GraphData } from "@/types";

import { ErrorMessage } from "@/components/common";

import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import type { GraphElement } from "@/lib/utils/sigma-adapter";

import {
  AgentSelectionProvider,
  useAgentSelectionContext,
} from "../_contexts/agent-selection-context";
import type { ChatGraphContext } from "../_contexts/chat-context";
import { GraphSearchHistoryProvider } from "../_contexts/graph-context";
import Chat from "./chat";
import GraphWrapper from "./graph/graph-wrapper";
import {
  extractEpisodesFromGraphNodes,
  graphDataToElements,
  mergeGraphData,
  parseHydrationResponse,
} from "./helpers/graph-data";
import { normalizeNodeId } from "./helpers/graph-normalize";
import { buildGraphStatePayload } from "./helpers/graph-state";
import { GraphExplorerPanel } from "./select-panel/graph-explorer-panel";
import type { EpisodeTimelineItem } from "./select-panel/graph-explorer-panel";
import { GraphExplorerPanelProvider } from "./select-panel/panel-context";
import GraphStatusOverlay from "./ui/graph-status-overlay";
import type { WikiNodeData } from "./wiki/wiki-panel-container";
import { WikiPanelContainer } from "./wiki/wiki-panel-container";
import { WikiPanelProvider, useWikiPanel } from "./wiki/wiki-panel-context";

/**
 * GraphExplorer Component
 * Main orchestrating component for graph visualization, wiki, chat, and timeline features
 */

/** When provided, bonfire/agent are fixed; URL and initial props are ignored and graph selector is hidden. */
export interface StaticGraphConfig {
  staticBonfireId: string;
  staticAgentId: string;
}

interface GraphExplorerProps {
  /** Initial bonfire ID from URL */
  initialBonfireId?: string | null;
  /** Initial agent ID from URL */
  initialAgentId?: string | null;
  /** When set, use only these IDs (ignore URL/initial) and hide graph selector dropdowns */
  staticGraph?: StaticGraphConfig | null;
  /** When true, hide the graph selector (e.g. when a subdomain is configured). If not set, selector is shown. */
  hideGraphSelector?: boolean;
  /** Whether to run in embedded mode (limited interactions) */
  embedded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * GraphExplorer - Main graph visualization component
 */
export function GraphExplorer({
  initialBonfireId,
  initialAgentId,
  staticGraph,
  hideGraphSelector = false,
  embedded = false,
  className,
}: GraphExplorerProps) {
  const searchParams = useSearchParams();
  const urlBonfireId = staticGraph
    ? staticGraph.staticBonfireId
    : (searchParams.get("bonfireId") ?? initialBonfireId ?? null);
  const urlAgentId = staticGraph
    ? staticGraph.staticAgentId
    : (searchParams.get("agentId") ?? initialAgentId ?? null);
  const urlCenterNode = searchParams.get("centerNode");
  const urlSearchQuery = searchParams.get("q") ?? "";

  return (
    <AgentSelectionProvider
      initialBonfireId={urlBonfireId}
      initialAgentId={urlAgentId}
      forceInitialSelection={!!staticGraph}
    >
      <GraphExplorerContent
        urlAgentId={urlAgentId}
        urlCenterNode={urlCenterNode}
        urlSearchQuery={urlSearchQuery}
        embedded={embedded}
        className={className}
        hideGraphSelector={hideGraphSelector}
      />
    </AgentSelectionProvider>
  );
}

/** Body rendered inside WikiPanelProvider; uses useWikiPanel() directly. */
function GraphExplorerBody({
  className,
  setSelectedEpisodeId,
  setPanToNodeId,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isGraphLoading,
  episodes,
  selectedEpisodeId,
  elements,
  hideGraphSelector,
  embedded,
  openChatRef,
  graphError,
  onRetry,
  selection,
  highlightedNodeIds,
  effectiveCenterNode,
  panToNodeId,
  handleBackgroundClick,
  panel,
  getChatGraphContext,
  agentSelection,
}: {
  className?: string;
  setSelectedEpisodeId: (id: string | null) => void;
  setPanToNodeId: (id: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  isGraphLoading: boolean;
  episodes: EpisodeTimelineItem[];
  selectedEpisodeId: string | null;
  elements: GraphElement[];
  hideGraphSelector: boolean;
  embedded: boolean;
  openChatRef: React.MutableRefObject<() => void>;
  graphError: Error | string | null;
  onRetry: () => void;
  selection: { selectedNodeId: string | null; selectedEdgeId: string | null };
  highlightedNodeIds: string[];
  effectiveCenterNode: string | null;
  panToNodeId: string | null;
  handleBackgroundClick: () => void;
  panel: { rightPanelMode: string };
  getChatGraphContext: () => ChatGraphContext;
  agentSelection: ReturnType<typeof useAgentSelectionContext>;
}) {
  const wiki = useWikiPanel();
  const {
    handleNodeClick: _wikiH,
    handleEdgeClick: _wikiE,
    ...wikiPanelContainerProps
  } = wiki;
  const handleEpisodeSelect = useCallback(
    (episodeUuid: string) => {
      setSelectedEpisodeId(episodeUuid);
      setPanToNodeId(episodeUuid);
      wiki.handleNodeClick(`n:${episodeUuid}`);
    },
    [setSelectedEpisodeId, setPanToNodeId, wiki]
  );

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      <GraphExplorerPanelProvider
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        onSearch={onSearch}
        isSearching={isGraphLoading}
        episodes={episodes}
        selectedEpisodeId={selectedEpisodeId}
        onEpisodeSelect={handleEpisodeSelect}
        episodesLoading={isGraphLoading}
        graphVisible={elements.length > 0}
        hideGraphSelector={hideGraphSelector}
        onOpenChat={!embedded ? () => openChatRef.current?.() : undefined}
      >
        <GraphExplorerPanel />
      </GraphExplorerPanelProvider>
      <main className="flex-1 flex flex-col overflow-hidden">
        <h1 className="sr-only">Graph Explorer</h1>
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 relative">
            {graphError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-100/80">
                <ErrorMessage
                  message={
                    (graphError as Error | null)?.message ??
                    "Failed to load graph"
                  }
                  onRetry={onRetry}
                  variant="card"
                />
              </div>
            )}
            <GraphWrapper
              elements={elements}
              loading={isGraphLoading}
              error={graphError}
              selectedNodeId={selection.selectedNodeId}
              selectedEdgeId={selection.selectedEdgeId}
              highlightedNodeIds={highlightedNodeIds}
              centerNodeId={effectiveCenterNode}
              panToNodeId={panToNodeId}
              onPanToNodeComplete={() => setPanToNodeId(null)}
              onNodeClick={wiki.handleNodeClick}
              onEdgeClick={wiki.handleEdgeClick}
              onBackgroundClick={handleBackgroundClick}
            />
          </div>
          {panel.rightPanelMode === "wiki" && (
            <WikiPanelContainer {...wikiPanelContainerProps} />
          )}
        </div>
      </main>
      {!embedded && (
        <Chat
          agentId={agentSelection.selectedAgentId ?? undefined}
          agentName={agentSelection.selectedAgent?.name}
          bonfireId={agentSelection.selectedBonfireId ?? undefined}
          getGraphContext={getChatGraphContext}
          onReady={({ openChat }) => {
            openChatRef.current = openChat;
          }}
        />
      )}
    </div>
  );
}

/** Inner content that consumes agent selection from context. */
function GraphExplorerContent({
  urlAgentId,
  urlCenterNode,
  urlSearchQuery,
  embedded,
  className,
  hideGraphSelector,
}: {
  urlAgentId: string | null;
  urlCenterNode: string | null;
  urlSearchQuery: string;
  embedded: boolean;
  className?: string;
  hideGraphSelector: boolean;
}) {
  const agentSelection = useAgentSelectionContext();
  const searchParams = useSearchParams();

  // Effective search/center (from URL or from in-page "Search around this node" — no navigation)
  const [effectiveSearchQuery, setEffectiveSearchQuery] =
    useState(urlSearchQuery);
  const [effectiveCenterNode, setEffectiveCenterNode] = useState<string | null>(
    urlCenterNode
  );

  // State management
  const { state, actions } = useGraphExplorerState();
  const { selection, panel } = state;
  const { dispatchSelection, dispatchPanel } = actions;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLimit] = useState(30);

  // Graph data - using the graph query hook (effective = URL or in-page "Search around this node")
  // Use "relationships" only as API fallback when center node is set and search is empty (do not put in search bar)
  const queryForApi =
    effectiveSearchQuery.trim() || (effectiveCenterNode ? "relationships" : "");
  const shouldRunGraphQuery =
    !!agentSelection.selectedBonfireId && queryForApi.length > 0;
  const graphQuery = useGraphQuery({
    bonfire_id: agentSelection.selectedBonfireId ?? "",
    agent_id: agentSelection.selectedAgentId ?? undefined,
    center_uuid: effectiveCenterNode ?? undefined,
    limit: searchLimit,
    search_query: queryForApi || undefined,
    enabled: shouldRunGraphQuery,
    useAsyncPolling: true,
  });

  const [initialGraphData, setInitialGraphData] = useState<GraphData | null>(
    null
  );
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [extraGraphData, setExtraGraphData] = useState<GraphData | null>(null);
  const expandCenterRef = useRef<string | null>(null);
  const { expand } = useGraphExpand();
  const nodeCacheRef = useRef<Map<string, GraphElement["data"]>>(new Map());

  // Mock episodes for timeline (will be populated from graph data)
  const [episodes, setEpisodes] = useState<EpisodeTimelineItem[]>([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(
    null
  );
  /** One-shot: when set, graph pans to this node (no graph data update). Cleared by GraphWrapper. */
  const [panToNodeId, setPanToNodeId] = useState<string | null>(null);

  const latestEpisodeUuids = useMemo(() => {
    const episodeUuids = agentSelection.selectedAgent?.episode_uuids;
    if (!episodeUuids || episodeUuids.length === 0) return [];
    return episodeUuids.slice(-10);
  }, [agentSelection.selectedAgent?.episode_uuids]);

  const hydrateLatestEpisodes = useCallback(async () => {
    if (!agentSelection.selectedAgentId || !agentSelection.selectedBonfireId)
      return;

    setIsHydrating(true);
    setHydrationError(null);

    try {
      const response = await apiClient.post<AgentLatestEpisodesResponse>(
        `/api/agents/${agentSelection.selectedAgentId}/episodes/search`,
        {
          limit: latestEpisodeUuids.length > 0 ? latestEpisodeUuids.length : 10,
        }
      );

      const { graphData, episodeItems } = parseHydrationResponse(
        response,
        agentSelection.selectedBonfireId,
        agentSelection.selectedAgentId,
        latestEpisodeUuids
      );

      setInitialGraphData(graphData);
      setEpisodes(episodeItems);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load latest episodes";
      setHydrationError(message);
    } finally {
      setIsHydrating(false);
    }
  }, [
    agentSelection.selectedAgentId,
    agentSelection.selectedBonfireId,
    latestEpisodeUuids,
  ]);

  // Sync effective search/center from URL (e.g. after search bar submit or initial load)
  useEffect(() => {
    setEffectiveSearchQuery(urlSearchQuery);
    setEffectiveCenterNode(urlCenterNode);
  }, [urlSearchQuery, urlCenterNode]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    setInitialGraphData(null);
    setExtraGraphData(null);
    setEpisodes([]);
    setSelectedEpisodeId(null);
    setPanToNodeId(null);
    setHydrationError(null);
    expandCenterRef.current = null;
    setEffectiveSearchQuery(searchParams.get("q") ?? "");
    setEffectiveCenterNode(searchParams.get("centerNode"));
  }, [
    agentSelection.selectedAgentId,
    agentSelection.selectedBonfireId,
    searchParams,
  ]);

  useEffect(() => {
    if (!agentSelection.selectedAgentId || !agentSelection.selectedBonfireId)
      return;
    if (effectiveSearchQuery.trim()) return;
    if (isHydrating || initialGraphData) return;

    void hydrateLatestEpisodes();
  }, [
    agentSelection.selectedAgentId,
    agentSelection.selectedBonfireId,
    effectiveSearchQuery,
    isHydrating,
    initialGraphData,
    hydrateLatestEpisodes,
  ]);

  const activeGraphData = graphQuery.data ?? initialGraphData;

  const combinedGraphData = useMemo(
    () => mergeGraphData(activeGraphData, extraGraphData),
    [activeGraphData, extraGraphData]
  );
  const isGraphLoading = graphQuery.isLoading || isHydrating;
  const graphError =
    graphQuery.error ?? (hydrationError ? new Error(hydrationError) : null);

  // Convert graph data to elements: one node per canonical id (uuid), all edges preserved
  const elements: GraphElement[] = useMemo(
    () =>
      graphDataToElements(
        combinedGraphData,
        effectiveCenterNode,
        nodeCacheRef.current
      ),
    [combinedGraphData, effectiveCenterNode]
  );

  useEffect(() => {
    if (!agentSelection.selectedBonfireId || !effectiveCenterNode) return;
    if (!activeGraphData) return;

    const centerId = effectiveCenterNode.replace(/^n:/, "");
    if (!centerId) return;

    const expandKey = `${agentSelection.selectedBonfireId}:${centerId}:${effectiveSearchQuery}`;
    if (expandCenterRef.current === expandKey) return;

    expandCenterRef.current = expandKey;
    expand({
      bonfire_id: agentSelection.selectedBonfireId,
      node_uuid: centerId,
      depth: 1,
      limit: 50,
    })
      .then((data) => {
        setExtraGraphData((prev) => mergeGraphData(prev, data));
      })
      .catch(() => {
        expandCenterRef.current = null;
      });
  }, [
    activeGraphData,
    agentSelection.selectedBonfireId,
    expand,
    effectiveCenterNode,
    effectiveSearchQuery,
  ]);

  useEffect(() => {
    if (elements.length === 0) return;
    const nextCache = new Map(nodeCacheRef.current);
    for (const element of elements) {
      if (!element.data?.id) continue;
      const rawId = element.data.id as string;
      const normalizedId = rawId.replace(/^n:/, "");
      nextCache.set(normalizedId, element.data);
    }
    nodeCacheRef.current = nextCache;
  }, [elements]);

  // Update episodes from graph data
  useEffect(() => {
    if (!activeGraphData?.nodes) return;
    setEpisodes(extractEpisodesFromGraphNodes(activeGraphData.nodes));
  }, [activeGraphData?.nodes]);

  // Get selected node/edge data
  const selectedNode = useMemo((): WikiNodeData | null => {
    if (!selection.selectedNodeId) return null;
    const element = elements.find(
      (el) =>
        el.data?.id === selection.selectedNodeId ||
        el.data?.id === `n:${selection.selectedNodeId}`
    );
    if (!element?.data) return null;
    return {
      uuid: (element.data["id"] as string).replace(/^n:/, ""),
      name:
        (element.data["label"] as string) || (element.data["name"] as string),
      label: element.data["label"] as string | undefined,
      type: element.data["node_type"] as "episode" | "entity" | undefined,
      node_type: element.data["node_type"] as "episode" | "entity" | undefined,
      summary: element.data["summary"] as string | undefined,
      content: element.data["content"] as string | undefined,
      valid_at: element.data["valid_at"] as string | undefined,
      attributes: element.data["attributes"] as
        | Record<string, unknown>
        | undefined,
      labels: element.data["labels"] as string[] | undefined,
    };
  }, [selection.selectedNodeId, elements]);

  // Only highlight nodes when there is an explicit selection; do not highlight center node on initial load.
  const highlightedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (selection.selectedNodeId) {
      ids.add(selection.selectedNodeId.replace(/^n:/, ""));
      if (effectiveCenterNode) {
        ids.add(effectiveCenterNode.replace(/^n:/, ""));
      }
    }
    return Array.from(ids);
  }, [selection.selectedNodeId, effectiveCenterNode]);

  // Handlers
  const handleBackgroundClick = useCallback(() => {
    dispatchSelection({ type: SelectionActionType.CLEAR_SELECTION });
  }, [dispatchSelection]);

  const [searchSubmitCount, setSearchSubmitCount] = useState(0);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    const nextQuery = searchQuery.trim();
    setEffectiveSearchQuery(nextQuery);
    setEffectiveCenterNode(null);
    setSearchSubmitCount((c) => c + 1);
  }, [searchQuery]);

  const handleSearchAroundNode = useCallback(
    (nodeUuid: string) => {
      const trimmed = searchQuery.trim();
      setSearchQuery(trimmed);
      setEffectiveSearchQuery(trimmed);
      setEffectiveCenterNode(nodeUuid);
    },
    [searchQuery]
  );

  const onNavigateToCenter = useCallback((nodeId: string) => {
    setEffectiveCenterNode(nodeId);
  }, []);

  const getChatGraphContext = useCallback(() => {
    const centerNodeId =
      selection.selectedNodeId ?? effectiveCenterNode ?? null;
    return {
      centerNodeUuid: centerNodeId ? normalizeNodeId(centerNodeId) : null,
      graphState: buildGraphStatePayload(elements, centerNodeId),
    };
  }, [selection.selectedNodeId, effectiveCenterNode, elements]);

  const openChatRef = useRef<() => void>(() => {});

  const handleRetry = useCallback(() => {
    if (shouldRunGraphQuery) {
      void graphQuery.refetch();
      return;
    }
    void hydrateLatestEpisodes();
  }, [graphQuery, hydrateLatestEpisodes, shouldRunGraphQuery]);

  // Loading state
  if (!agentSelection.isInitialized) {
    return <GraphStatusOverlay isLoading={true} message="Initializing..." />;
  }

  return (
    <GraphSearchHistoryProvider
      onNavigateToCenter={onNavigateToCenter}
      urlAgentId={urlAgentId ?? null}
      searchSubmitCount={searchSubmitCount}
      effectiveCenterNode={effectiveCenterNode}
      selectedNode={selectedNode ?? null}
      handleSearchAroundNode={handleSearchAroundNode}
    >
      <WikiPanelProvider
        elements={elements}
        selection={selection}
        panel={panel}
        dispatchSelection={dispatchSelection}
        dispatchPanel={dispatchPanel}
        onBeforeNodeSelect={() => setSelectedEpisodeId(null)}
      >
        <GraphExplorerBody
          className={className}
          setSelectedEpisodeId={setSelectedEpisodeId}
          setPanToNodeId={setPanToNodeId}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={handleSearch}
          isGraphLoading={isGraphLoading}
          episodes={episodes}
          selectedEpisodeId={selectedEpisodeId}
          elements={elements}
          hideGraphSelector={hideGraphSelector}
          embedded={embedded}
          openChatRef={openChatRef}
          graphError={graphError}
          onRetry={handleRetry}
          selection={selection}
          highlightedNodeIds={highlightedNodeIds}
          effectiveCenterNode={effectiveCenterNode}
          panToNodeId={panToNodeId}
          handleBackgroundClick={handleBackgroundClick}
          panel={panel}
          getChatGraphContext={getChatGraphContext}
          agentSelection={agentSelection}
        />
      </WikiPanelProvider>
    </GraphSearchHistoryProvider>
  );
}

export default GraphExplorer;
