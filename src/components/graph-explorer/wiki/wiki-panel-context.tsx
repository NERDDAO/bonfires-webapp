/**
 * Wiki panel context and provider
 * Owns wiki display state (last displayed node/edge, navigation) and derived data.
 * Parent supplies elements, selection, panel, dispatchers, and search callback.
 */
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { PanelAction, SelectionAction } from "@/hooks";
import { PanelActionType, SelectionActionType } from "@/hooks";
import type { GraphElement } from "@/lib/utils/sigma-adapter";

import { useGraphSearchHistoryOptional } from "@/components/graph-explorer/graph-context";

import {
  elementToWikiEdge,
  elementToWikiNode,
  type WikiEdgeData,
  type WikiNodeData,
} from "./wiki-panel-utils";

export interface WikiPanelProviderProps {
  children: React.ReactNode;
  elements: GraphElement[];
  selection: { selectedNodeId: string | null; selectedEdgeId: string | null };
  panel: {
    wikiEnabled: boolean;
    rightPanelMode: string;
    wikiMode: "sidebar" | "full";
    wikiMinimized: boolean;
  };
  dispatchSelection: (action: SelectionAction) => void;
  dispatchPanel: (action: PanelAction) => void;
  onSearchAroundNode?: (nodeUuid: string) => void;
  /** Called before handling node selection (e.g. clear episode selection) */
  onBeforeNodeSelect?: () => void;
}

export interface WikiPanelContextValue {
  node: WikiNodeData | null;
  edge: WikiEdgeData | null;
  nodeRelationships: WikiEdgeData[];
  enabled: boolean;
  mode: "sidebar" | "full";
  minimized: boolean;
  onMinimizedChange: (minimized: boolean) => void;
  onClose: () => void;
  onToggleMode: () => void;
  onNodeSelect: (nodeId: string) => void;
  onSearchAroundNode: ((nodeUuid: string) => void) | undefined;
  getRelatedNodeTitle: (nodeId: string) => string | undefined;
  handleNodeClick: (nodeId: string) => void;
  handleEdgeClick: (edgeId: string) => void;
}

const WikiPanelContext = createContext<WikiPanelContextValue | null>(null);

export function WikiPanelProvider({
  children,
  elements,
  selection,
  panel,
  dispatchSelection,
  dispatchPanel,
  onSearchAroundNode: onSearchAroundNodeProp,
  onBeforeNodeSelect,
}: WikiPanelProviderProps) {
  const historyCtx = useGraphSearchHistoryOptional();
  const onSearchAroundNode =
    onSearchAroundNodeProp ?? historyCtx?.searchAroundNode;

  const [lastWikiDisplay, setLastWikiDisplay] = useState<{
    nodeId: string | null;
    edgeId: string | null;
  }>({ nodeId: null, edgeId: null });

  const displayedNodeId = selection.selectedNodeId ?? lastWikiDisplay.nodeId;
  const displayedEdgeId = selection.selectedEdgeId ?? lastWikiDisplay.edgeId;

  const node = useMemo((): WikiNodeData | null => {
    if (!displayedNodeId) return null;
    const el = elements.find(
      (e) =>
        e.data?.id === displayedNodeId || e.data?.id === `n:${displayedNodeId}`
    );
    return el?.data ? elementToWikiNode(el.data) : null;
  }, [displayedNodeId, elements]);

  const edge = useMemo((): WikiEdgeData | null => {
    if (!displayedEdgeId) return null;
    const el = elements.find((e) => e.data?.id === displayedEdgeId);
    return el?.data ? elementToWikiEdge(el.data) : null;
  }, [displayedEdgeId, elements]);

  const nodeRelationships = useMemo((): WikiEdgeData[] => {
    if (!displayedNodeId) return [];
    const nodeId = displayedNodeId.replace(/^n:/, "");
    return elements
      .filter(
        (el) =>
          el.data?.source &&
          el.data?.target &&
          (el.data.source.includes(nodeId) || el.data.target.includes(nodeId))
      )
      .map((el) => elementToWikiEdge(el.data))
      .filter((e): e is WikiEdgeData => e != null);
  }, [displayedNodeId, elements]);

  const getRelatedNodeTitle = useCallback(
    (nodeId: string): string | undefined => {
      const normalizedId = nodeId.replace(/^n:/, "");
      const el = elements.find(
        (e) =>
          e.data?.node_type != null &&
          (e.data?.id === normalizedId || e.data?.id === `n:${normalizedId}`)
      );
      if (!el?.data) return undefined;
      const title =
        (el.data.label as string | undefined) ??
        (el.data.name as string | undefined);
      return title ?? undefined;
    },
    [elements]
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      onBeforeNodeSelect?.();
      if (!nodeId) {
        dispatchSelection({ type: SelectionActionType.CLEAR_SELECTION });
        return;
      }
      dispatchSelection({
        type: SelectionActionType.SELECT_NODE,
        nodeId,
        userTriggered: true,
      });
      setLastWikiDisplay({ nodeId, edgeId: null });

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
      panel.wikiEnabled,
      panel.rightPanelMode,
      onBeforeNodeSelect,
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

  const onClose = useCallback(() => {
    setLastWikiDisplay({ nodeId: null, edgeId: null });
    dispatchSelection({ type: SelectionActionType.CLEAR_SELECTION });
    dispatchPanel({ type: PanelActionType.SET_PANEL_MODE, mode: "none" });
  }, [dispatchSelection, dispatchPanel]);

  const onMinimizedChange = useCallback(
    (minimized: boolean) => {
      dispatchPanel({
        type: PanelActionType.SET_WIKI_MINIMIZED,
        minimized,
      });
    },
    [dispatchPanel]
  );

  const onToggleMode = useCallback(() => {
    dispatchPanel({
      type: PanelActionType.SET_WIKI_MODE,
      mode: panel.wikiMode === "sidebar" ? "full" : "sidebar",
    });
  }, [dispatchPanel, panel.wikiMode]);

  const value = useMemo<WikiPanelContextValue>(
    () => ({
      node,
      edge,
      nodeRelationships,
      enabled: panel.wikiEnabled,
      mode: panel.wikiMode,
      minimized: panel.wikiMinimized,
      onMinimizedChange,
      onClose,
      onToggleMode,
      onNodeSelect: handleNodeClick,
      onSearchAroundNode,
      getRelatedNodeTitle,
      handleNodeClick,
      handleEdgeClick,
    }),
    [
      node,
      edge,
      nodeRelationships,
      panel.wikiEnabled,
      panel.wikiMode,
      panel.wikiMinimized,
      onMinimizedChange,
      onClose,
      onToggleMode,
      handleNodeClick,
      handleEdgeClick,
      onSearchAroundNode,
      getRelatedNodeTitle,
    ]
  );

  return (
    <WikiPanelContext.Provider value={value}>
      {children}
    </WikiPanelContext.Provider>
  );
}

export function useWikiPanel(): WikiPanelContextValue {
  const ctx = useContext(WikiPanelContext);
  if (!ctx) {
    throw new Error("useWikiPanel must be used within WikiPanelProvider");
  }
  return ctx;
}

