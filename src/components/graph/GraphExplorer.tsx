/**
 * GraphExplorer Component
 * Main orchestrating component for graph visualization, wiki, chat, and timeline features
 */

"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, RefreshCw, Settings } from "lucide-react";
import { useWalletAccount } from "@/lib/wallet/e2e";

import { cn } from "@/lib/cn";
import { LoadingSpinner, ErrorMessage, toast } from "@/components/common";
import { apiClient } from "@/lib/api/client";
import {
  useGraphExplorerState,
  useWikiNavigation,
  useAgentSelection,
  useBonfiresQuery,
  useGraphQuery,
  useSendChatMessage,
  SelectionActionType,
  PanelActionType,
  type PanelMode,
} from "@/hooks";

import { GraphVisualization } from "./GraphVisualization";
import { Timeline, type EpisodeTimelineItem } from "./Timeline";
import { WikiPanel, type WikiNodeData, type WikiEdgeData } from "./WikiPanel";
import { ChatPanel, FloatingChatButton, type ChatMessage } from "./ChatPanel";
import { NodeContextMenu, type NodeData } from "./NodeContextMenu";
import type { GraphElement } from "@/lib/utils/sigma-adapter";
import type { AgentLatestEpisodesResponse, GraphData, GraphEdge, GraphNode, NodeType } from "@/types";

function resolveNodeType(rawType: unknown, labels: string[]): NodeType {
  const normalized = typeof rawType === "string" ? rawType.toLowerCase() : "";
  if (normalized.includes("episode")) return "episode";
  if (normalized.includes("entity")) return "entity";
  const hasEpisodeLabel = labels.some((label) => label.toLowerCase() === "episode");
  return hasEpisodeLabel ? "episode" : "entity";
}

function buildProperties(raw: Record<string, unknown>): Record<string, unknown> {
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
    ? raw["labels"].filter((label): label is string => typeof label === "string")
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

interface GraphExplorerProps {
  /** Initial bonfire ID from URL */
  initialBonfireId?: string | null;
  /** Initial agent ID from URL */
  initialAgentId?: string | null;
  /** Whether to run in embedded mode (limited interactions) */
  embedded?: boolean;
  /** Callback when "Create Data Room" is clicked */
  onCreateDataRoom?: (nodeData: NodeData, bonfireId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * GraphExplorer - Main graph visualization component
 */
export function GraphExplorer({
  initialBonfireId,
  initialAgentId,
  embedded = false,
  onCreateDataRoom,
  className,
}: GraphExplorerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address: walletAddress, isConnected: isWalletConnected } = useWalletAccount();

  // URL parameters
  const urlBonfireId = searchParams.get("bonfireId") ?? initialBonfireId;
  const urlAgentId = searchParams.get("agentId") ?? initialAgentId;
  const urlCenterNode = searchParams.get("centerNode");
  const urlSearchQuery = searchParams.get("q") ?? "";

  // State management
  const { state, actions } = useGraphExplorerState();
  const { selection, panel, timeline } = state;
  const { dispatchSelection, dispatchPanel, dispatchTimeline } = actions;

  // Wiki navigation
  const wikiNav = useWikiNavigation();

  // Agent selection
  const agentSelection = useAgentSelection({
    initialBonfireId: urlBonfireId,
    initialAgentId: urlAgentId,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLimit, setSearchLimit] = useState(30);

  // Graph data - using the graph query hook
  const shouldRunGraphQuery = !!agentSelection.selectedBonfireId && urlSearchQuery.trim().length > 0;
  const graphQuery = useGraphQuery({
    bonfire_id: agentSelection.selectedBonfireId ?? "",
    agent_id: agentSelection.selectedAgentId ?? undefined,
    center_uuid: urlCenterNode ?? undefined,
    limit: searchLimit,
    search_query: urlSearchQuery.trim() || undefined,
    enabled: shouldRunGraphQuery,
    useAsyncPolling: true,
  });

  const [initialGraphData, setInitialGraphData] = useState<GraphData | null>(null);
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);

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
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);

  const latestEpisodeUuids = useMemo(() => {
    const episodeUuids = agentSelection.selectedAgent?.episode_uuids;
    if (!episodeUuids || episodeUuids.length === 0) return [];
    return episodeUuids.slice(-10);
  }, [agentSelection.selectedAgent?.episode_uuids]);

  const hydrateLatestEpisodes = useCallback(async () => {
    if (!agentSelection.selectedAgentId || !agentSelection.selectedBonfireId) return;

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

      const responseEpisodes: EpisodeTimelineItem[] = (response.episodes ?? []).map(
        (episode) => {
          const episodeRecord = episode as Record<string, unknown>;
          return {
            uuid: String(episodeRecord["uuid"] ?? episodeRecord["id"] ?? ""),
            name: (episodeRecord["name"] ??
              episodeRecord["title"]) as string | undefined,
            summary: episodeRecord["summary"] as string | undefined,
            valid_at: episodeRecord["valid_at"] as string | undefined,
          };
        }
      );

      let episodeItems: EpisodeTimelineItem[] = responseEpisodes.filter(
        (episode) => episode.uuid
      );
      if (episodeItems.length === 0) {
        episodeItems = nodes
          .filter((node) => node.type === "episode")
          .map((node) => ({
            uuid: node.uuid,
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

      const preferredCenter =
        urlCenterNode ??
        latestEpisodeUuids[latestEpisodeUuids.length - 1] ??
        episodeItems[episodeItems.length - 1]?.uuid ??
        null;

      const hasCenterNode = preferredCenter
        ? nodes.some((node) => node.uuid === preferredCenter)
        : false;

      if (preferredCenter && hasCenterNode) {
        setSelectedEpisodeId(preferredCenter);
        dispatchSelection({
          type: SelectionActionType.SELECT_NODE,
          nodeId: preferredCenter,
          userTriggered: false,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load latest episodes";
      setHydrationError(message);
    } finally {
      setIsHydrating(false);
    }
  }, [
    agentSelection.selectedAgentId,
    agentSelection.selectedBonfireId,
    latestEpisodeUuids,
    urlCenterNode,
    dispatchSelection,
  ]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    setInitialGraphData(null);
    setEpisodes([]);
    setSelectedEpisodeId(null);
    setHydrationError(null);
  }, [agentSelection.selectedAgentId, agentSelection.selectedBonfireId]);

  useEffect(() => {
    if (!agentSelection.selectedAgentId || !agentSelection.selectedBonfireId) return;
    if (urlSearchQuery.trim()) return;
    if (isHydrating || initialGraphData) return;

    void hydrateLatestEpisodes();
  }, [
    agentSelection.selectedAgentId,
    agentSelection.selectedBonfireId,
    urlSearchQuery,
    isHydrating,
    initialGraphData,
    hydrateLatestEpisodes,
  ]);

  const activeGraphData = graphQuery.data ?? initialGraphData;
  const isGraphLoading = graphQuery.isLoading || isHydrating;
  const graphError = graphQuery.error ?? (hydrationError ? new Error(hydrationError) : null);

  // Convert graph data to elements
  const elements: GraphElement[] = useMemo(() => {
    if (!activeGraphData) return [];

    const result: GraphElement[] = [];
    const embeddedPositions = new Map<string, { x: number; y: number }>();
    const embeddings: Array<{ id: string; x: number; y: number }> = [];

    for (const node of activeGraphData.nodes) {
      const nodeRecord = node as Record<string, unknown>;
      const nodeId = String(nodeRecord["uuid"] ?? nodeRecord["id"] ?? "").replace(/^n:/, "");
      if (!nodeId) continue;

      const properties =
        (nodeRecord["properties"] as Record<string, unknown> | undefined) ??
        (nodeRecord["attributes"] as Record<string, unknown> | undefined) ??
        {};
      const embedding =
        (properties["embedding"] as number[] | undefined) ??
        (nodeRecord["embedding"] as number[] | undefined) ??
        (properties["vector"] as number[] | undefined) ??
        (nodeRecord["vector"] as number[] | undefined);

      if (
        Array.isArray(embedding) &&
        embedding.length >= 2 &&
        typeof embedding[0] === "number" &&
        typeof embedding[1] === "number"
      ) {
        embeddings.push({ id: nodeId, x: embedding[0], y: embedding[1] });
      }
    }

    if (embeddings.length > 0) {
      const xs = embeddings.map((entry) => entry.x);
      const ys = embeddings.map((entry) => entry.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const scale = (value: number, min: number, max: number) => {
        if (max === min) return 0;
        const normalized = (value - min) / (max - min);
        return normalized * 200 - 100;
      };

      for (const entry of embeddings) {
        embeddedPositions.set(entry.id, {
          x: scale(entry.x, minX, maxX),
          y: scale(entry.y, minY, maxY),
        });
      }
    }

    // Convert nodes
    for (const node of activeGraphData.nodes) {
      const nodeRecord = node as Record<string, unknown>;
      const rawLabels = nodeRecord["labels"];
      const labels = Array.isArray(rawLabels)
        ? rawLabels.filter((label): label is string => typeof label === "string")
        : [];
      const nodeType = resolveNodeType(
        nodeRecord["type"] ?? nodeRecord["node_type"] ?? nodeRecord["entity_type"],
        labels
      );
      const nodeId = String(nodeRecord["uuid"] ?? nodeRecord["id"] ?? "").replace(/^n:/, "");
      if (!nodeId) continue;
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

      const embeddedPosition = embeddedPositions.get(nodeId);

      result.push({
        data: {
          id: `n:${nodeId}`,
          label: (nodeRecord["name"] ?? nodeRecord["label"] ?? nodeRecord["title"] ?? "") as
            | string
            | undefined,
          node_type: nodeType,
          labels,
          x: embeddedPosition?.x,
          y: embeddedPosition?.y,
          ...properties,
        },
      });
    }

    // Convert edges
    for (const edge of activeGraphData.edges) {
      const edgeRecord = edge as Record<string, unknown>;
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
      const edgeType =
        (edgeRecord["type"] ??
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
          id: `e:${sourceId}-${targetId}`,
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

    return result;
  }, [activeGraphData]);

  // Update episodes from graph data
  useEffect(() => {
    if (!activeGraphData?.nodes) return;

    const episodeNodes = activeGraphData.nodes
      .filter((n) => {
        const nodeRecord = n as Record<string, unknown>;
        const nodeType = nodeRecord["type"] ?? nodeRecord["node_type"];
        return nodeType === "episode";
      })
      .map((n) => {
        const nodeRecord = n as Record<string, unknown>;
        const properties =
          (nodeRecord["properties"] as Record<string, unknown> | undefined) ??
          (nodeRecord["attributes"] as Record<string, unknown> | undefined) ??
          {};
        return {
          uuid: String(nodeRecord["uuid"] ?? "").replace(/^n:/, ""),
          name: nodeRecord["name"] as string | undefined,
          valid_at: (properties["valid_at"] ??
            nodeRecord["valid_at"]) as string | undefined,
          summary: (properties["summary"] ??
            nodeRecord["summary"]) as string | undefined,
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
      name: (element.data["label"] as string) || (element.data["name"] as string),
      label: element.data["label"] as string | undefined,
      type: element.data["node_type"] as "episode" | "entity" | undefined,
      node_type: element.data["node_type"] as "episode" | "entity" | undefined,
      summary: element.data["summary"] as string | undefined,
      content: element.data["content"] as string | undefined,
      valid_at: element.data["valid_at"] as string | undefined,
      attributes: element.data["attributes"] as Record<string, unknown> | undefined,
      labels: element.data["labels"] as string[] | undefined,
    };
  }, [selection.selectedNodeId, elements]);

  const selectedEdge = useMemo((): WikiEdgeData | null => {
    if (!selection.selectedEdgeId) return null;
    const element = elements.find((el) => el.data?.id === selection.selectedEdgeId);
    if (!element?.data || !element.data["source"] || !element.data["target"]) return null;
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
      attributes: element.data["attributes"] as Record<string, unknown> | undefined,
    };
  }, [selection.selectedEdgeId, elements]);

  // Get node relationships
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
        fact: el.data!.fact as string | undefined,
      }));
  }, [selection.selectedNodeId, elements]);

  // Handlers
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (!nodeId) {
        dispatchSelection({ type: SelectionActionType.CLEAR_SELECTION });
        return;
      }

      dispatchSelection({
        type: SelectionActionType.SELECT_NODE,
        nodeId,
        userTriggered: true,
      });

      // Update wiki navigation
      const element = elements.find(
        (el) => el.data?.id === nodeId || el.data?.id === `n:${nodeId}`
      );
      if (element?.data) {
        const nodeType = element.data.node_type as "episode" | "entity" | undefined;
        wikiNav.navigateTo({
          type: nodeType || "entity",
          id: nodeId.replace(/^n:/, ""),
          label: element.data.label || element.data.name,
        });
      }

      // Open wiki panel if enabled
      if (panel.wikiEnabled && panel.rightPanelMode === "none") {
        dispatchPanel({ type: PanelActionType.SET_PANEL_MODE, mode: "wiki" });
      }
    },
    [dispatchSelection, dispatchPanel, elements, panel.wikiEnabled, panel.rightPanelMode, wikiNav]
  );

  const handleEdgeClick = useCallback(
    (edgeId: string) => {
      dispatchSelection({
        type: SelectionActionType.SELECT_EDGE,
        edgeId,
        userTriggered: true,
      });
    },
    [dispatchSelection]
  );

  const handleEpisodeSelect = useCallback(
    (episodeUuid: string) => {
      setSelectedEpisodeId(episodeUuid);
      handleNodeClick(`n:${episodeUuid}`);
    },
    [handleNodeClick]
  );

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    // The search will be triggered by URL params change
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", searchQuery);
    router.push(`/graph?${params.toString()}`);
  }, [searchQuery, searchParams, router]);

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
        const response = await chatMutation.mutateAsync({
          agentId: agentSelection.selectedAgentId,
          message: content,
          bonfireId: agentSelection.selectedBonfireId ?? undefined,
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
    [agentSelection.selectedAgentId, agentSelection.selectedBonfireId, chatMutation]
  );

  const handleToggleChatPanel = useCallback(() => {
    const newMode: PanelMode = panel.rightPanelMode === "chat" ? "none" : "chat";
    dispatchPanel({ type: PanelActionType.SET_PANEL_MODE, mode: newMode });
  }, [panel.rightPanelMode, dispatchPanel]);

  const handleRefresh = useCallback(() => {
    if (shouldRunGraphQuery) {
      void graphQuery.refetch();
      return;
    }

    void hydrateLatestEpisodes();
  }, [graphQuery, hydrateLatestEpisodes, shouldRunGraphQuery]);

  // Loading state
  if (!agentSelection.isInitialized) {
    return (
      <main className={cn("flex flex-col items-center justify-center h-full", className)}>
        <h1 className="sr-only">Graph Explorer</h1>
        <LoadingSpinner size="lg" text="Initializing..." />
      </main>
    );
  }

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-base-300 bg-base-100 shrink-0">
        <div className="flex items-center gap-4">
          {/* Bonfire/Agent Selection */}
          <div className="flex items-center gap-2">
            <select
              value={agentSelection.selectedBonfire?.id ?? ""}
              onChange={(e) => agentSelection.selectBonfire(e.target.value || null)}
              className="select select-bordered select-sm"
              disabled={agentSelection.loading.bonfires}
              aria-label="Select bonfire"
            >
              <option value="">Select Bonfire</option>
              {agentSelection.availableBonfires.map((bonfire) => (
                <option key={bonfire.id} value={bonfire.id}>
                  {bonfire.name}
                </option>
              ))}
            </select>

            <select
              value={agentSelection.selectedAgent?.id ?? ""}
              onChange={(e) => agentSelection.selectAgent(e.target.value || null)}
              className="select select-bordered select-sm"
              disabled={!agentSelection.selectedBonfire || agentSelection.loading.agents}
              aria-label="Select agent"
            >
              <option value="">Select Agent</option>
              {agentSelection.availableAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          {!embedded && (
            <div className="flex items-center gap-2">
              <div className="join">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search graph..."
                  className="input input-bordered input-sm join-item w-48"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isGraphLoading}
                  className="btn btn-primary btn-sm join-item"
                  aria-label="Search graph"
                  title="Search graph"
                  type="button"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isGraphLoading}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", isGraphLoading && "animate-spin")} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <h1 className="sr-only">Graph Explorer</h1>
        {/* Timeline */}
        {!embedded && (
          <Timeline
            episodes={episodes}
            selectedEpisodeId={selectedEpisodeId}
            onEpisodeSelect={handleEpisodeSelect}
            loading={isGraphLoading}
          />
        )}

        {/* Graph and Panels */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Graph Visualization */}
          <div className="flex-1 relative">
            {graphError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-100/80">
                <ErrorMessage
                  message={(graphError as Error | null)?.message ?? "Failed to load graph"}
                  onRetry={handleRefresh}
                  variant="card"
                />
              </div>
            )}

            <GraphVisualization
              elements={elements}
              loading={isGraphLoading}
              error={graphError}
              selectedNodeId={selection.selectedNodeId}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
            />
          </div>

          {/* Wiki Panel */}
          {panel.rightPanelMode === "wiki" && (
            <WikiPanel
              node={selectedNode}
              edge={selectedEdge}
              edgeSourceNode={null} // TODO: Implement
              edgeTargetNode={null} // TODO: Implement
              nodeRelationships={nodeRelationships}
              enabled={panel.wikiEnabled}
              mode={panel.wikiMode}
              breadcrumbs={wikiNav.breadcrumbs}
              canGoBack={wikiNav.canGoBack}
              canGoForward={wikiNav.canGoForward}
              onClose={() => {
                dispatchSelection({ type: SelectionActionType.CLEAR_SELECTION });
                dispatchPanel({ type: PanelActionType.SET_PANEL_MODE, mode: "none" });
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
            mode={panel.rightPanelMode === "chat" ? "chat" : "none"}
            error={chatMutation.error?.message}
            onSendMessage={handleSendChatMessage}
            onModeChange={(mode) =>
              dispatchPanel({ type: PanelActionType.SET_PANEL_MODE, mode })
            }
            onClearError={() => chatMutation.reset()}
          />

          <FloatingChatButton
            mode={panel.rightPanelMode}
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
        onCreateDataRoom={onCreateDataRoom ? handleCreateDataRoom : undefined}
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
}

export default GraphExplorer;
