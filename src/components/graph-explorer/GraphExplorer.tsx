/**
 * GraphExplorer Component
 * Main orchestrating component for graph visualization, wiki, chat, and timeline features
 */
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
  PanelActionType,
  SelectionActionType,
  useAgentSelection,
  useBonfiresQuery,
  useGraphExpand,
  useGraphExplorerState,
  useGraphQuery,
  useSendChatMessage,
  useWikiNavigation,
} from "@/hooks";
import type {
  AgentLatestEpisodesResponse,
  GraphData,
  GraphEdge,
  GraphElementPayload,
  GraphNode,
  GraphStatePayload,
  NodeType,
} from "@/types";

import { ErrorMessage, LoadingSpinner, toast } from "@/components/common";

import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { synthesizeEpisodicEdges } from "@/lib/utils/graph-utils";
import type { GraphElement } from "@/lib/utils/sigma-adapter";
import { useWalletAccount } from "@/lib/wallet/e2e";

import { NodeContextMenu, type NodeData } from "./NodeContextMenu";
import { type ChatMessage, ChatPanel, FloatingChatButton } from "./chat";
import {
  GraphSearchHistoryProvider,
  useGraphSearchHistory,
} from "./graph-context";
import GraphWrapper from "./graph/graph-wrapper";
import { GraphExplorerPanel } from "./select-panel/graph-explorer-panel";
import type { EpisodeTimelineItem } from "./select-panel/graph-explorer-panel";
import GraphStatusOverlay from "./ui/graph-status-overlay";
import {
  type WikiEdgeData,
  type WikiNodeData,
  WikiPanelContainer,
} from "./wiki/wiki-panel-container";

/**
 * GraphExplorer Component
 * Main orchestrating component for graph visualization, wiki, chat, and timeline features
 */

function resolveNodeType(rawType: unknown, labels: string[]): NodeType {
  const normalized = typeof rawType === "string" ? rawType.toLowerCase() : "";
  if (normalized.includes("episode")) return "episode";
  if (normalized.includes("entity")) return "entity";
  const hasEpisodeLabel = labels.some(
    (label) => label.toLowerCase() === "episode"
  );
  return hasEpisodeLabel ? "episode" : "entity";
}

function buildProperties(
  raw: Record<string, unknown>
): Record<string, unknown> {
  const base = { ...raw };
  if (raw["properties"] && typeof raw["properties"] === "object") {
    Object.assign(base, raw["properties"] as Record<string, unknown>);
  }
  return base;
}

function normalizeNode(raw: Record<string, unknown>): GraphNode | null {
  const rawUuid = String(
    raw["uuid"] ?? raw["id"] ?? raw["node_uuid"] ?? raw["nodeId"] ?? ""
  );
  const uuid = rawUuid.replace(/^n:/, "");
  if (!uuid) return null;

  const labels = Array.isArray(raw["labels"])
    ? raw["labels"].filter(
        (label): label is string => typeof label === "string"
      )
    : [];

  const nameCandidate =
    raw["name"] ?? raw["label"] ?? raw["title"] ?? raw["summary"] ?? uuid;
  const type = resolveNodeType(
    raw["type"] ?? raw["node_type"] ?? raw["entity_type"],
    labels
  );

  return {
    uuid,
    name: String(nameCandidate),
    type,
    labels,
    properties: buildProperties(raw),
  };
}

function normalizeNodeId(value: unknown): string {
  return String(value ?? "").replace(/^n:/, "");
}

function normalizeEdge(raw: Record<string, unknown>): GraphEdge | null {
  const sourceValue =
    raw["source"] ??
    raw["source_uuid"] ??
    raw["source_node_uuid"] ??
    raw["from_uuid"] ??
    raw["from"];
  const targetValue =
    raw["target"] ??
    raw["target_uuid"] ??
    raw["target_node_uuid"] ??
    raw["to_uuid"] ??
    raw["to"];

  if (!sourceValue || !targetValue) return null;

  const type = String(
    raw["type"] ??
      raw["relationship"] ??
      raw["relationship_type"] ??
      raw["label"] ??
      "related_to"
  );

  return {
    source: normalizeNodeId(sourceValue),
    target: normalizeNodeId(targetValue),
    type,
    properties: buildProperties(raw),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

function buildGraphStatePayload(
  elements: GraphElement[],
  centerNodeId: string | null
): GraphStatePayload {
  const nodes: GraphElementPayload[] = [];
  const edges: GraphElementPayload[] = [];

  for (const element of elements) {
    if (!element.data) continue;
    const data = { ...element.data } as GraphElementPayload["data"];

    if (typeof data.node_type === "string") {
      nodes.push({
        data,
        classes: element.classes,
      });
      continue;
    }

    if (data.source && data.target) {
      edges.push({
        data,
        classes: element.classes,
      });
    }
  }

  return {
    nodes,
    edges,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    centerNodeUuid: centerNodeId
      ? normalizeNodeId(centerNodeId) || undefined
      : undefined,
    lastUpdated: new Date().toISOString(),
  };
}

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
  /** Whether to run in embedded mode (limited interactions) */
  embedded?: boolean;
  /** Callback when "Create Data Room" is clicked */
  onCreateDataRoom?: (nodeData: NodeData, bonfireId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/** Bridge that uses search history context and provides breadcrumbs + wrapped handler. */
function GraphExplorerSearchHistoryBridge({
  handleSearchAroundNode,
  selectedNode,
  urlAgentId,
  searchSubmitCount,
  effectiveCenterNode,
  render,
}: {
  handleSearchAroundNode: (nodeUuid: string) => void;
  selectedNode: WikiNodeData | null;
  urlAgentId: string | null | undefined;
  searchSubmitCount: number;
  effectiveCenterNode: string | null;
  render: (props: {
    searchHistoryBreadcrumbs: { label: string; onClick: () => void }[];
    activeBreadcrumb: string | null;
    handleSearchAroundNode: (nodeUuid: string) => void;
  }) => React.ReactNode;
}) {
  const {
    pushSearchAround,
    resetSearchHistory,
    searchHistoryStack,
    currentIndex,
    navigateToSearchHistoryIndex,
  } = useGraphSearchHistory();

  useEffect(() => {
    resetSearchHistory();
  }, [urlAgentId, searchSubmitCount, resetSearchHistory]);

  // Seed stack with current center when graph has a center but stack is empty (so breadcrumbs show on load)
  useEffect(() => {
    if (!effectiveCenterNode || searchHistoryStack.length > 0) return;
    const label =
      selectedNode?.uuid === effectiveCenterNode
        ? (selectedNode?.name ?? selectedNode?.label)
        : undefined;
    pushSearchAround(effectiveCenterNode, label);
  }, [
    effectiveCenterNode,
    searchHistoryStack.length,
    pushSearchAround,
    selectedNode,
  ]);

  const handleSearchAroundNodeWithPush = useCallback(
    (nodeUuid: string) => {
      handleSearchAroundNode(nodeUuid);
      pushSearchAround(
        nodeUuid,
        selectedNode?.name ?? selectedNode?.label ?? undefined
      );
    },
    [handleSearchAroundNode, pushSearchAround, selectedNode]
  );

  const searchHistoryBreadcrumbs = useMemo(
    () =>
      searchHistoryStack.map((item, i) => ({
        label: item.label ?? item.nodeId.slice(0, 8),
        onClick: () => navigateToSearchHistoryIndex(i),
      })),
    [searchHistoryStack, navigateToSearchHistoryIndex]
  );

  const activeBreadcrumb =
    currentIndex >= 0 && currentIndex < searchHistoryStack.length
      ? (searchHistoryStack[currentIndex]?.label ??
        searchHistoryStack[currentIndex]?.nodeId.slice(0, 8) ??
        null)
      : null;

  return (
    <>
      {render({
        searchHistoryBreadcrumbs,
        activeBreadcrumb,
        handleSearchAroundNode: handleSearchAroundNodeWithPush,
      })}
    </>
  );
}

/**
 * GraphExplorer - Main graph visualization component
 */
export function GraphExplorer({
  initialBonfireId,
  initialAgentId,
  staticGraph,
  embedded = false,
  onCreateDataRoom,
  className,
}: GraphExplorerProps) {
  const searchParams = useSearchParams();
  const { address: walletAddress, isConnected: isWalletConnected } =
    useWalletAccount();

  // When staticGraph is provided, ignore URL and initial props; otherwise use URL/initial
  const effectiveBonfireId = staticGraph
    ? staticGraph.staticBonfireId
    : (searchParams.get("bonfireId") ?? initialBonfireId);
  const effectiveAgentId = staticGraph
    ? staticGraph.staticAgentId
    : (searchParams.get("agentId") ?? initialAgentId);

  const urlBonfireId = effectiveBonfireId;
  const urlAgentId = effectiveAgentId;
  const urlCenterNode = searchParams.get("centerNode");
  const urlSearchQuery = searchParams.get("q") ?? "";

  // Effective search/center (from URL or from in-page "Search around this node" — no navigation)
  const [effectiveSearchQuery, setEffectiveSearchQuery] =
    useState(urlSearchQuery);
  const [effectiveCenterNode, setEffectiveCenterNode] = useState<string | null>(
    urlCenterNode
  );

  // State management
  const { state, actions } = useGraphExplorerState();
  const { selection, panel, timeline } = state;
  const { dispatchSelection, dispatchPanel, dispatchTimeline } = actions;

  // Wiki navigation
  const wikiNav = useWikiNavigation();

  // Agent selection (when staticGraph is set, force IDs even if not in fetched lists)
  const agentSelection = useAgentSelection({
    initialBonfireId: urlBonfireId ?? undefined,
    initialAgentId: urlAgentId ?? undefined,
    forceInitialSelection: !!staticGraph,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLimit, setSearchLimit] = useState(30);

  // Last node/edge shown in wiki panel; kept when selection is cleared (e.g. background click) so panel content persists
  const [lastWikiDisplay, setLastWikiDisplay] = useState<{
    nodeId: string | null;
    edgeId: string | null;
  }>({ nodeId: null, edgeId: null });

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

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatMutation = useSendChatMessage();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    nodeData: NodeData | null;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    nodeData: null,
  });

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

      const rawNodes = [
        ...(response.nodes ?? []),
        ...(response.entities ?? []),
      ];
      const nodes = rawNodes
        .map((node) => normalizeNode(node as Record<string, unknown>))
        .filter((node): node is GraphNode => !!node);

      const edges = (response.edges ?? [])
        .map((edge) => normalizeEdge(edge as Record<string, unknown>))
        .filter((edge): edge is GraphEdge => !!edge);

      const graphData: GraphData = {
        nodes,
        edges,
        metadata: {
          bonfire_id: agentSelection.selectedBonfireId,
          agent_id: agentSelection.selectedAgentId,
          query: "latest_episodes",
          timestamp: new Date().toISOString(),
        },
      };

      setInitialGraphData(graphData);

      const responseEpisodes: EpisodeTimelineItem[] = (
        response.episodes ?? []
      ).map((episode) => {
        const episodeRecord = episode as Record<string, unknown>;
        return {
          uuid: String(episodeRecord["uuid"] ?? episodeRecord["id"] ?? ""),
          name: (episodeRecord["name"] ?? episodeRecord["title"]) as
            | string
            | undefined,
          summary: episodeRecord["summary"] as string | undefined,
          valid_at: episodeRecord["valid_at"] as string | undefined,
        };
      });

      let episodeItems: EpisodeTimelineItem[] = responseEpisodes.filter(
        (episode) => episode.uuid
      );
      if (episodeItems.length === 0) {
        episodeItems = nodes
          .filter((node) => node.type === "episode" && !!node.uuid)
          .map((node) => ({
            uuid: node.uuid as string,
            name: node.name,
            summary: node.properties?.["summary"] as string | undefined,
            valid_at: node.properties?.["valid_at"] as string | undefined,
          }));
      }

      if (latestEpisodeUuids.length > 0) {
        const episodeById = new Map(
          episodeItems.map((episode) => [episode.uuid, episode])
        );
        const filtered = latestEpisodeUuids.flatMap((uuid) => {
          const episode = episodeById.get(uuid);
          return episode ? [episode] : [];
        });
        if (filtered.length > 0) {
          episodeItems = filtered;
        }
      }

      setEpisodes(episodeItems);

      // Do not auto-select a node on first load so the graph starts with no active state.
      // preferredCenter is still used elsewhere (e.g. panning) when set from URL.
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
  }, [agentSelection.selectedAgentId, agentSelection.selectedBonfireId]);

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

  const mergeGraphData = useCallback(
    (base: GraphData | null, incoming: GraphData | null) => {
      if (!base) return incoming;
      if (!incoming) return base;

      const nodeIds = new Set<string>();
      const mergedNodes: GraphData["nodes"] = [];

      for (const node of base.nodes) {
        const nodeRecord = asRecord(node);
        const nodeId = String(
          nodeRecord["uuid"] ?? nodeRecord["id"] ?? ""
        ).replace(/^n:/, "");
        if (!nodeId || nodeIds.has(nodeId)) continue;
        nodeIds.add(nodeId);
        mergedNodes.push(node);
      }

      for (const node of incoming.nodes) {
        const nodeRecord = asRecord(node);
        const nodeId = String(
          nodeRecord["uuid"] ?? nodeRecord["id"] ?? ""
        ).replace(/^n:/, "");
        if (!nodeId || nodeIds.has(nodeId)) continue;
        nodeIds.add(nodeId);
        mergedNodes.push(node);
      }

      const edgeKeys = new Set<string>();
      const mergedEdges: GraphData["edges"] = [];

      const addEdge = (edge: GraphData["edges"][number]) => {
        const edgeRecord = asRecord(edge);
        const sourceId = normalizeNodeId(
          edgeRecord["source"] ??
            edgeRecord["source_uuid"] ??
            edgeRecord["source_node_uuid"] ??
            edgeRecord["from_uuid"] ??
            edgeRecord["from"]
        );
        const targetId = normalizeNodeId(
          edgeRecord["target"] ??
            edgeRecord["target_uuid"] ??
            edgeRecord["target_node_uuid"] ??
            edgeRecord["to_uuid"] ??
            edgeRecord["to"]
        );
        if (!sourceId || !targetId) return;
        const edgeType = String(
          edgeRecord["type"] ??
            edgeRecord["relationship"] ??
            edgeRecord["relationship_type"] ??
            edgeRecord["label"] ??
            ""
        );
        const key = `${sourceId}|${targetId}|${edgeType}`;
        if (edgeKeys.has(key)) return;
        edgeKeys.add(key);
        mergedEdges.push(edge);
      };

      for (const edge of base.edges) addEdge(edge);
      for (const edge of incoming.edges) addEdge(edge);

      return {
        nodes: mergedNodes,
        edges: mergedEdges,
        metadata: base.metadata ?? incoming.metadata,
      };
    },
    []
  );

  const combinedGraphData = useMemo(
    () => mergeGraphData(activeGraphData, extraGraphData),
    [activeGraphData, extraGraphData, mergeGraphData]
  );
  const isGraphLoading = graphQuery.isLoading || isHydrating;
  const graphError =
    graphQuery.error ?? (hydrationError ? new Error(hydrationError) : null);

  // Convert graph data to elements: one node per canonical id (uuid), all edges preserved
  const elements: GraphElement[] = useMemo(() => {
    if (!combinedGraphData) return [];

    const result: GraphElement[] = [];
    const nodeIds = new Set<string>();
    const cachedNodes = nodeCacheRef.current;

    // Convert nodes — one element per canonical node id (uuid); duplicates are merged into a single node
    for (const node of combinedGraphData.nodes) {
      const nodeRecord = asRecord(node);
      const nodeId = String(
        nodeRecord["uuid"] ?? nodeRecord["id"] ?? ""
      ).replace(/^n:/, "");
      if (!nodeId || nodeIds.has(nodeId)) continue;
      nodeIds.add(nodeId);

      const rawLabels = nodeRecord["labels"];
      const labels = Array.isArray(rawLabels)
        ? rawLabels.filter(
            (label): label is string => typeof label === "string"
          )
        : [];
      const nodeType = resolveNodeType(
        nodeRecord["type"] ??
          nodeRecord["node_type"] ??
          nodeRecord["entity_type"],
        labels
      );
      const properties =
        (nodeRecord["properties"] as Record<string, unknown> | undefined) ??
        (nodeRecord["attributes"] as Record<string, unknown> | undefined) ??
        {};
      if (!("content" in properties) && nodeRecord["content"] !== undefined) {
        properties["content"] = nodeRecord["content"];
      }
      if (!("summary" in properties) && nodeRecord["summary"] !== undefined) {
        properties["summary"] = nodeRecord["summary"];
      }
      if (!("valid_at" in properties) && nodeRecord["valid_at"] !== undefined) {
        properties["valid_at"] = nodeRecord["valid_at"];
      }

      result.push({
        data: {
          id: `n:${nodeId}`,
          label: (nodeRecord["name"] ??
            nodeRecord["label"] ??
            nodeRecord["title"] ??
            "") as string | undefined,
          node_type: nodeType,
          labels,
          ...properties,
        },
      });
    }

    // Convert edges: include every edge whose endpoints exist; one node per id so all connections attach to the single node
    let edgeIndex = 0;
    for (const edge of combinedGraphData.edges) {
      const edgeRecord = asRecord(edge);
      const sourceValue =
        edgeRecord["source"] ??
        edgeRecord["source_uuid"] ??
        edgeRecord["source_node_uuid"] ??
        edgeRecord["from_uuid"] ??
        edgeRecord["from"];
      const targetValue =
        edgeRecord["target"] ??
        edgeRecord["target_uuid"] ??
        edgeRecord["target_node_uuid"] ??
        edgeRecord["to_uuid"] ??
        edgeRecord["to"];
      if (!sourceValue || !targetValue) continue;
      const sourceId = String(sourceValue).replace(/^n:/, "");
      const targetId = String(targetValue).replace(/^n:/, "");
      if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) continue;
      const uniqueEdgeId = `e:${sourceId}-${targetId}-${edgeIndex}`;
      edgeIndex += 1;
      const edgeType = (edgeRecord["type"] ??
        edgeRecord["relationship"] ??
        edgeRecord["relationship_type"] ??
        edgeRecord["label"]) as string | undefined;
      const edgeName = edgeRecord["name"] as string | undefined;
      const edgeFact = edgeRecord["fact"] as string | undefined;
      const properties =
        (edgeRecord["properties"] as Record<string, unknown> | undefined) ??
        (edgeRecord["attributes"] as Record<string, unknown> | undefined) ??
        (edgeRecord as Record<string, unknown>);

      result.push({
        data: {
          id: uniqueEdgeId,
          source: `n:${sourceId}`,
          target: `n:${targetId}`,
          label: edgeName ?? edgeType ?? edgeFact,
          name: edgeName,
          fact: edgeFact,
          relationship: edgeType,
          attributes: properties,
          ...properties,
        },
      });
    }

    // Synthesize episodic edges: connect episode nodes to entities they mention
    const episodicEdges = synthesizeEpisodicEdges(
      combinedGraphData.edges,
      nodeIds
    );
    result.push(...episodicEdges);

    const centerId = effectiveCenterNode?.replace(/^n:/, "");
    if (centerId && !nodeIds.has(centerId)) {
      const cached = cachedNodes.get(centerId);
      const cachedLabel =
        (cached?.label as string | undefined) ??
        (cached?.name as string | undefined) ??
        (cached?.["title"] as string | undefined);

      result.push({
        data: {
          ...(cached ?? {}),
          id: `n:${centerId}`,
          label: cachedLabel ?? `center:${centerId.slice(0, 8)}`,
          node_type:
            (cached?.node_type as "episode" | "entity" | undefined) ??
            "episode",
          placeholder: !cached,
        },
      });
      nodeIds.add(centerId);
    }

    return result;
  }, [combinedGraphData, effectiveCenterNode]);

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
    mergeGraphData,
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

    const episodeNodes = activeGraphData.nodes
      .filter((n) => {
        const nodeRecord = asRecord(n);
        const nodeType = nodeRecord["type"] ?? nodeRecord["node_type"];
        return nodeType === "episode";
      })
      .map((n) => {
        const nodeRecord = asRecord(n);
        const properties =
          (nodeRecord["properties"] as Record<string, unknown> | undefined) ??
          (nodeRecord["attributes"] as Record<string, unknown> | undefined) ??
          {};
        return {
          uuid: String(nodeRecord["uuid"] ?? "").replace(/^n:/, ""),
          name: nodeRecord["name"] as string | undefined,
          valid_at: (properties["valid_at"] ?? nodeRecord["valid_at"]) as
            | string
            | undefined,
          content: (properties["content"] ?? nodeRecord["content"]) as
            | string
            | undefined,
        };
      });

    setEpisodes(episodeNodes);
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

  const selectedEdge = useMemo((): WikiEdgeData | null => {
    if (!selection.selectedEdgeId) return null;
    const element = elements.find(
      (el) => el.data?.id === selection.selectedEdgeId
    );
    if (!element?.data || !element.data["source"] || !element.data["target"])
      return null;
    return {
      id: element.data["id"] as string,
      label: element.data["name"] as string | undefined,
      relation_type:
        (element.data["relationship"] as string | undefined) ??
        (element.data["label"] as string | undefined),
      source: element.data["source"] as string,
      target: element.data["target"] as string,
      strength: element.data["rel_strength"] as number | undefined,
      fact: element.data["fact"] as string | undefined,
      attributes: element.data["attributes"] as
        | Record<string, unknown>
        | undefined,
    };
  }, [selection.selectedEdgeId, elements]);

  // IDs to show in wiki panel: current selection, or last selected when selection is cleared (e.g. background click)
  const displayedNodeId =
    selection.selectedNodeId ?? lastWikiDisplay.nodeId;
  const displayedEdgeId =
    selection.selectedEdgeId ?? lastWikiDisplay.edgeId;

  // Displayed node/edge data for wiki panel (persists when selection is cleared)
  const displayedNode = useMemo((): WikiNodeData | null => {
    if (!displayedNodeId) return null;
    const element = elements.find(
      (el) =>
        el.data?.id === displayedNodeId ||
        el.data?.id === `n:${displayedNodeId}`
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
  }, [displayedNodeId, elements]);

  const displayedEdge = useMemo((): WikiEdgeData | null => {
    if (!displayedEdgeId) return null;
    const element = elements.find(
      (el) => el.data?.id === displayedEdgeId
    );
    if (!element?.data || !element.data["source"] || !element.data["target"])
      return null;
    return {
      id: element.data["id"] as string,
      label: element.data["name"] as string | undefined,
      relation_type:
        (element.data["relationship"] as string | undefined) ??
        (element.data["label"] as string | undefined),
      source: element.data["source"] as string,
      target: element.data["target"] as string,
      strength: element.data["rel_strength"] as number | undefined,
      fact: element.data["fact"] as string | undefined,
      attributes: element.data["attributes"] as
        | Record<string, unknown>
        | undefined,
    };
  }, [displayedEdgeId, elements]);

  // Get node relationships (for selected node, used by wiki panel)
  const nodeRelationships = useMemo((): WikiEdgeData[] => {
    if (!selection.selectedNodeId) return [];
    const nodeId = selection.selectedNodeId.replace(/^n:/, "");
    return elements
      .filter(
        (el) =>
          el.data?.source &&
          el.data?.target &&
          (el.data.source.includes(nodeId) || el.data.target.includes(nodeId))
      )
      .map((el) => ({
        id: el.data!.id,
        label: el.data!.name as string | undefined,
        relation_type:
          (el.data!.relationship as string | undefined) ??
          (el.data!.label as string | undefined),
        source: el.data!.source!,
        target: el.data!.target!,
        fact: el.data!["fact"] as string | undefined,
      }));
  }, [selection.selectedNodeId, elements]);

  // Node relationships for displayed node (so wiki panel keeps showing them when selection is cleared)
  const displayedNodeRelationships = useMemo((): WikiEdgeData[] => {
    if (!displayedNodeId) return [];
    const nodeId = displayedNodeId.replace(/^n:/, "");
    return elements
      .filter(
        (el) =>
          el.data?.source &&
          el.data?.target &&
          (el.data.source.includes(nodeId) || el.data.target.includes(nodeId))
      )
      .map((el) => ({
        id: el.data!.id,
        label: el.data!.name as string | undefined,
        relation_type:
          (el.data!.relationship as string | undefined) ??
          (el.data!.label as string | undefined),
        source: el.data!.source!,
        target: el.data!.target!,
        fact: el.data!["fact"] as string | undefined,
      }));
  }, [displayedNodeId, elements]);

  // Map node id -> display title (name/label) for relationship targets
  const getRelatedNodeTitle = useCallback(
    (nodeId: string): string | undefined => {
      const normalizedId = nodeId.replace(/^n:/, "");
      const element = elements.find(
        (el) =>
          el.data?.node_type != null &&
          (el.data?.id === normalizedId || el.data?.id === `n:${normalizedId}`)
      );
      if (!element?.data) return undefined;
      const title =
        (element.data.label as string | undefined) ??
        (element.data.name as string | undefined);
      return title ?? undefined;
    },
    [elements]
  );

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
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (!nodeId) {
        dispatchSelection({ type: SelectionActionType.CLEAR_SELECTION });
        setSelectedEpisodeId(null);
        return;
      }

      setSelectedEpisodeId(null);

      dispatchSelection({
        type: SelectionActionType.SELECT_NODE,
        nodeId,
        userTriggered: true,
      });
      setLastWikiDisplay({ nodeId, edgeId: null });

      // Update wiki navigation
      const element = elements.find(
        (el) => el.data?.id === nodeId || el.data?.id === `n:${nodeId}`
      );
      if (element?.data) {
        const nodeType = element.data.node_type as
          | "episode"
          | "entity"
          | undefined;
        wikiNav.navigateTo({
          type: nodeType || "entity",
          id: nodeId.replace(/^n:/, ""),
          label: element.data.label || element.data.name,
        });
      }

      // Open wiki panel if minimized and expand so contents are visible
      if (panel.wikiEnabled) {
        if (panel.rightPanelMode === "none") {
          dispatchPanel({ type: PanelActionType.SET_PANEL_MODE, mode: "wiki" });
        }
        dispatchPanel({ type: PanelActionType.SET_WIKI_MODE, mode: "full" });
        dispatchPanel({
          type: PanelActionType.SET_WIKI_MINIMIZED,
          minimized: false,
        });
      }
    },
    [
      dispatchSelection,
      dispatchPanel,
      elements,
      panel.wikiEnabled,
      panel.rightPanelMode,
      wikiNav,
    ]
  );

  const handleEdgeClick = useCallback(
    (edgeId: string) => {
      dispatchSelection({
        type: SelectionActionType.SELECT_EDGE,
        edgeId,
        userTriggered: true,
      });
      setLastWikiDisplay({ nodeId: null, edgeId });

      // Open wiki panel when closed so edge content is visible (same as node click)
      if (panel.wikiEnabled) {
        if (panel.rightPanelMode === "none") {
          dispatchPanel({ type: PanelActionType.SET_PANEL_MODE, mode: "wiki" });
        }
        dispatchPanel({ type: PanelActionType.SET_WIKI_MODE, mode: "full" });
        dispatchPanel({
          type: PanelActionType.SET_WIKI_MINIMIZED,
          minimized: false,
        });
      }
    },
    [dispatchSelection, dispatchPanel, panel.wikiEnabled, panel.rightPanelMode]
  );

  const handleBackgroundClick = useCallback(() => {
    dispatchSelection({ type: SelectionActionType.CLEAR_SELECTION });
  }, [dispatchSelection]);

  const handleEpisodeSelect = useCallback(
    (episodeUuid: string) => {
      setSelectedEpisodeId(episodeUuid);
      setPanToNodeId(episodeUuid);
      handleNodeClick(`n:${episodeUuid}`);
    },
    [handleNodeClick]
  );

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

  const handleContextMenu = useCallback(
    (nodeData: NodeData, position: { x: number; y: number }) => {
      if (embedded) return; // No context menu in embedded mode
      setContextMenu({
        visible: true,
        position,
        nodeData,
      });
    },
    [embedded]
  );

  const handleExpandNode = useCallback((nodeData: NodeData) => {
    // Trigger graph expansion
    toast.info(`Expanding node: ${nodeData.label || nodeData.id}`);
    // TODO: Implement node expansion
  }, []);

  const handleDeleteNode = useCallback((nodeData: NodeData) => {
    // Remove node from graph
    toast.info(`Removed: ${nodeData.label || nodeData.id}`);
    // TODO: Implement node deletion
  }, []);

  const handleCreateDataRoom = useCallback(
    (nodeData: NodeData) => {
      if (!isWalletConnected) {
        toast.warning("Connect your wallet to create a data room");
        return;
      }
      if (!agentSelection.selectedBonfireId) {
        toast.error("No bonfire selected");
        return;
      }
      onCreateDataRoom?.(nodeData, agentSelection.selectedBonfireId);
    },
    [isWalletConnected, agentSelection.selectedBonfireId, onCreateDataRoom]
  );

  const handleSendChatMessage = useCallback(
    async (content: string) => {
      if (!agentSelection.selectedAgentId) {
        throw new Error("No agent selected");
      }

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, userMessage]);

      try {
        const centerNodeId =
          selection.selectedNodeId ?? effectiveCenterNode ?? null;
        const graphState = buildGraphStatePayload(elements, centerNodeId);
        const response = await chatMutation.mutateAsync({
          agentId: agentSelection.selectedAgentId,
          message: content,
          bonfireId: agentSelection.selectedBonfireId ?? undefined,
          centerNodeUuid: graphState.centerNodeUuid,
          graphMode: "static",
          context: {
            graphState,
          },
        });

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.reply ?? "No response",
          timestamp: new Date().toISOString(),
        };

        setChatMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        toast.error("Failed to send message");
        throw error;
      }
    },
    [
      agentSelection.selectedAgentId,
      agentSelection.selectedBonfireId,
      chatMutation,
    ]
  );

  const handleToggleChatPanel = useCallback(() => {
    dispatchPanel({
      type: PanelActionType.SET_CHAT_OPEN,
      open: !panel.chatOpen,
    });
  }, [panel.chatOpen, dispatchPanel]);

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
    <GraphSearchHistoryProvider onNavigateToCenter={onNavigateToCenter}>
      <GraphExplorerSearchHistoryBridge
        handleSearchAroundNode={handleSearchAroundNode}
        selectedNode={selectedNode}
        urlAgentId={urlAgentId ?? null}
        searchSubmitCount={searchSubmitCount}
        effectiveCenterNode={effectiveCenterNode}
        render={({
          searchHistoryBreadcrumbs,
          activeBreadcrumb,
          handleSearchAroundNode: wrappedSearchAround,
        }) => (
          <div
            className={cn("flex flex-col h-full overflow-hidden", className)}
          >
            {/* Header */}
            <GraphExplorerPanel
              availableBonfires={agentSelection.availableBonfires}
              availableAgents={agentSelection.availableAgents}
              selectedBonfireId={agentSelection.selectedBonfireId}
              selectedAgentId={agentSelection.selectedAgentId}
              loading={agentSelection.loading}
              error={agentSelection.error}
              onSelectBonfire={agentSelection.selectBonfire}
              onSelectAgent={agentSelection.selectAgent}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSearch={handleSearch}
              isSearching={isGraphLoading}
              searchHistoryBreadcrumbs={searchHistoryBreadcrumbs}
              activeBreadcrumb={activeBreadcrumb}
              episodes={episodes}
              selectedEpisodeId={selectedEpisodeId}
              onEpisodeSelect={handleEpisodeSelect}
              episodesLoading={isGraphLoading}
              graphVisible={elements.length > 0}
              onOpenChat={handleToggleChatPanel}
              hideGraphSelector={!!staticGraph}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
              <h1 className="sr-only">Graph Explorer</h1>

              {/* Graph and Panels */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* Graph Visualization */}
                <div className="flex-1 relative">
                  {graphError && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-100/80">
                      <ErrorMessage
                        message={
                          (graphError as Error | null)?.message ??
                          "Failed to load graph"
                        }
                        onRetry={handleRetry}
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
                    onNodeClick={handleNodeClick}
                    onEdgeClick={handleEdgeClick}
                    onBackgroundClick={handleBackgroundClick}
                  />
                </div>

                {/* Wiki Panel (draggable container) */}
                {panel.rightPanelMode === "wiki" && (
                  <WikiPanelContainer
                    node={displayedNode}
                    edge={displayedEdge}
                    edgeSourceNode={null} // TODO: Implement
                    edgeTargetNode={null} // TODO: Implement
                    nodeRelationships={displayedNodeRelationships}
                    enabled={panel.wikiEnabled}
                    mode={panel.wikiMode}
                    minimized={panel.wikiMinimized}
                    onMinimizedChange={(minimized) =>
                      dispatchPanel({
                        type: PanelActionType.SET_WIKI_MINIMIZED,
                        minimized,
                      })
                    }
                    breadcrumbs={wikiNav.breadcrumbs}
                    canGoBack={wikiNav.canGoBack}
                    canGoForward={wikiNav.canGoForward}
                    onClose={() => {
                      setLastWikiDisplay({ nodeId: null, edgeId: null });
                      dispatchSelection({
                        type: SelectionActionType.CLEAR_SELECTION,
                      });
                      dispatchPanel({
                        type: PanelActionType.SET_PANEL_MODE,
                        mode: "none",
                      });
                    }}
                    onToggleMode={() =>
                      dispatchPanel({
                        type: PanelActionType.SET_WIKI_MODE,
                        mode: panel.wikiMode === "sidebar" ? "full" : "sidebar",
                      })
                    }
                    onBack={wikiNav.back}
                    onForward={wikiNav.forward}
                    onNodeSelect={handleNodeClick}
                    onSearchAroundNode={wrappedSearchAround}
                    getRelatedNodeTitle={getRelatedNodeTitle}
                  />
                )}
              </div>
            </main>

            {/* Chat Panel */}
            {!embedded && (
              <>
                <ChatPanel
                  agentId={agentSelection.selectedAgentId ?? undefined}
                  agentName={agentSelection.selectedAgent?.name}
                  messages={chatMessages}
                  isSending={chatMutation.isPending}
                  mode={panel.chatOpen ? "chat" : "none"}
                  error={chatMutation.error?.message}
                  onSendMessage={handleSendChatMessage}
                  onModeChange={(mode) =>
                    dispatchPanel({
                      type: PanelActionType.SET_CHAT_OPEN,
                      open: mode === "chat",
                    })
                  }
                  onClearError={() => chatMutation.reset()}
                />

                <FloatingChatButton
                  mode={panel.chatOpen ? "chat" : "none"}
                  onToggle={handleToggleChatPanel}
                />
              </>
            )}

            {/* Context Menu */}
            <NodeContextMenu
              visible={contextMenu.visible}
              position={contextMenu.position}
              nodeData={contextMenu.nodeData ?? { id: "" }}
              isWalletConnected={isWalletConnected}
              onExpand={handleExpandNode}
              onDelete={handleDeleteNode}
              onCreateDataRoom={
                onCreateDataRoom ? handleCreateDataRoom : undefined
              }
              onClose={() =>
                setContextMenu((prev) => ({ ...prev, visible: false }))
              }
            />
          </div>
        )}
      />
    </GraphSearchHistoryProvider>
  );
}

export default GraphExplorer;
