"use client";

/**
 * Graph search history context
 * Stores "search around this node" history as a path. Breadcrumb clicks only
 * change the current position; future crumbs are removed only when
 * "Search around this node" is clicked (then path is forked at current position).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface SearchHistoryItem {
  nodeId: string;
  label?: string;
}

/** Minimal node shape for provider effect deps (label derivation). */
export interface GraphSearchHistoryNodeSnapshot {
  uuid: string;
  name?: string;
  label?: string;
}

export interface GraphSearchHistoryContextValue {
  /** Full path of center nodes (oldest first). Not trimmed when navigating via breadcrumb. */
  searchHistoryStack: SearchHistoryItem[];
  /** Index in the path we're currently at (which center is active). */
  currentIndex: number;
  /** Push a node: replace path after current position with this node (fork). */
  pushSearchAround: (nodeId: string, label?: string) => void;
  /** Clear the path (e.g. when agent or search query changes). */
  resetSearchHistory: () => void;
  /** Go to a breadcrumb by index; keep full path, only change center. */
  navigateToSearchHistoryIndex: (index: number) => void;
  /** Breadcrumbs for UI; derived from stack. */
  searchHistoryBreadcrumbs: { label: string; onClick: () => void }[];
  /** Label of the currently active breadcrumb. */
  activeBreadcrumb: string | null;
  /** When set, call this to "search around" a node (pushes to history then invokes handler). */
  searchAroundNode: ((nodeUuid: string) => void) | undefined;
}

const GraphSearchHistoryContext =
  createContext<GraphSearchHistoryContextValue | null>(null);

export interface GraphSearchHistoryProviderProps {
  children: React.ReactNode;
  /** Called when user chooses a breadcrumb or pushes; consumer should set center node. */
  onNavigateToCenter: (nodeId: string) => void;
  /** When changed, history is reset (e.g. agent or query change). */
  urlAgentId?: string | null;
  /** When changed, history is reset. */
  searchSubmitCount?: number;
  /** When set and stack is empty, seed stack with this center (e.g. initial load). */
  effectiveCenterNode?: string | null;
  /** Used for breadcrumb labels when seeding or when pushing. */
  selectedNode?: GraphSearchHistoryNodeSnapshot | null;
  /** When provided, searchAroundNode in context will push then call this. */
  handleSearchAroundNode?: (nodeUuid: string) => void;
}

export function GraphSearchHistoryProvider({
  children,
  onNavigateToCenter,
  urlAgentId,
  searchSubmitCount,
  effectiveCenterNode,
  selectedNode,
  handleSearchAroundNode,
}: GraphSearchHistoryProviderProps) {
  const [searchHistoryStack, setSearchHistoryStack] = useState<
    SearchHistoryItem[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const pushSearchAround = useCallback(
    (nodeId: string, label?: string) => {
      const next = [
        ...searchHistoryStack.slice(0, currentIndex + 1),
        { nodeId, label },
      ];
      setSearchHistoryStack(next);
      setCurrentIndex(next.length - 1);
      onNavigateToCenter(nodeId);
    },
    [currentIndex, searchHistoryStack, onNavigateToCenter]
  );

  const resetSearchHistory = useCallback(() => {
    setSearchHistoryStack([]);
    setCurrentIndex(-1);
  }, []);

  const navigateToSearchHistoryIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= searchHistoryStack.length) return;
      const item = searchHistoryStack[index];
      setCurrentIndex(index);
      if (item) {
        queueMicrotask(() => onNavigateToCenter(item.nodeId));
      }
    },
    [searchHistoryStack, onNavigateToCenter]
  );

  // Reset history when agent or search query identity changes
  useEffect(() => {
    resetSearchHistory();
  }, [urlAgentId, searchSubmitCount, resetSearchHistory]);

  // Seed stack with current center when graph has a center but stack is empty
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
    selectedNode?.uuid,
    selectedNode?.name,
    selectedNode?.label,
  ]);

  const searchHistoryBreadcrumbs = useMemo(
    () =>
      searchHistoryStack.map((item, i) => ({
        label: item.label ?? item.nodeId.slice(0, 8),
        onClick: () => navigateToSearchHistoryIndex(i),
      })),
    [searchHistoryStack, navigateToSearchHistoryIndex]
  );

  const activeBreadcrumb = useMemo(
    () =>
      currentIndex >= 0 && currentIndex < searchHistoryStack.length
        ? (searchHistoryStack[currentIndex]?.label ??
          searchHistoryStack[currentIndex]?.nodeId.slice(0, 8) ??
          null)
        : null,
    [currentIndex, searchHistoryStack]
  );

  const searchAroundNode = useMemo(():
    | ((nodeUuid: string) => void)
    | undefined => {
    if (!handleSearchAroundNode) return undefined;
    return (nodeUuid: string) => {
      handleSearchAroundNode(nodeUuid);
      pushSearchAround(
        nodeUuid,
        selectedNode?.name ?? selectedNode?.label ?? undefined
      );
    };
  }, [handleSearchAroundNode, pushSearchAround, selectedNode?.name, selectedNode?.label]);

  const value = useMemo<GraphSearchHistoryContextValue>(
    () => ({
      searchHistoryStack,
      currentIndex,
      pushSearchAround,
      resetSearchHistory,
      navigateToSearchHistoryIndex,
      searchHistoryBreadcrumbs,
      activeBreadcrumb,
      searchAroundNode,
    }),
    [
      searchHistoryStack,
      currentIndex,
      pushSearchAround,
      resetSearchHistory,
      navigateToSearchHistoryIndex,
      searchHistoryBreadcrumbs,
      activeBreadcrumb,
      searchAroundNode,
    ]
  );

  return (
    <GraphSearchHistoryContext.Provider value={value}>
      {children}
    </GraphSearchHistoryContext.Provider>
  );
}

export function useGraphSearchHistory(): GraphSearchHistoryContextValue {
  const ctx = useContext(GraphSearchHistoryContext);
  if (!ctx) {
    throw new Error(
      "useGraphSearchHistory must be used within GraphSearchHistoryProvider"
    );
  }
  return ctx;
}

export function useGraphSearchHistoryOptional(): GraphSearchHistoryContextValue | null {
  return useContext(GraphSearchHistoryContext);
}
