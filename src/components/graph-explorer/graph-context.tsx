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
  useMemo,
  useState,
} from "react";

export interface SearchHistoryItem {
  nodeId: string;
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
}

const GraphSearchHistoryContext =
  createContext<GraphSearchHistoryContextValue | null>(null);

export interface GraphSearchHistoryProviderProps {
  children: React.ReactNode;
  /** Called when user chooses a breadcrumb or pushes; consumer should set center node. */
  onNavigateToCenter: (nodeId: string) => void;
}

export function GraphSearchHistoryProvider({
  children,
  onNavigateToCenter,
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

  const value = useMemo<GraphSearchHistoryContextValue>(
    () => ({
      searchHistoryStack,
      currentIndex,
      pushSearchAround,
      resetSearchHistory,
      navigateToSearchHistoryIndex,
    }),
    [
      searchHistoryStack,
      currentIndex,
      pushSearchAround,
      resetSearchHistory,
      navigateToSearchHistoryIndex,
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
