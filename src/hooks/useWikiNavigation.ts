/**
 * useWikiNavigation Hook
 * Navigation state management for the wiki panel
 */
"use client";

import { useCallback, useMemo, useRef, useState } from "react";

/**
 * useWikiNavigation Hook
 * Navigation state management for the wiki panel
 */

export type WikiContentType = "episode" | "edge" | "entity";

export interface WikiNavState {
  type: WikiContentType;
  id: string;
  label?: string;
}

export interface WikiBreadcrumb {
  label: string;
  onClick?: () => void;
}

export interface UseWikiNavigationReturn {
  /** Current wiki content being viewed */
  current: WikiNavState | null;
  /** Navigation history (back stack) */
  history: WikiNavState[];
  /** Forward stack (after going back) */
  forwardStack: WikiNavState[];
  /** Recently viewed items */
  recent: WikiNavState[];
  /** Breadcrumb items for navigation UI */
  breadcrumbs: WikiBreadcrumb[];
  /** Navigate to a specific wiki item */
  navigateTo: (state: WikiNavState) => void;
  /** Go back in history */
  back: () => void;
  /** Go forward in history */
  forward: () => void;
  /** Clear all navigation state */
  clear: () => void;
  /** Check if can go back */
  canGoBack: boolean;
  /** Check if can go forward */
  canGoForward: boolean;
}

/**
 * Hook for managing wiki navigation state
 * Provides browser-like back/forward navigation for wiki content
 */
export function useWikiNavigation(): UseWikiNavigationReturn {
  const [current, setCurrent] = useState<WikiNavState | null>(null);
  const historyRef = useRef<WikiNavState[]>([]);
  const forwardRef = useRef<WikiNavState[]>([]);
  const recentRef = useRef<WikiNavState[]>([]);

  // Force re-render when refs change
  const [, forceUpdate] = useState({});

  const navigateTo = useCallback(
    (next: WikiNavState) => {
      if (current) {
        historyRef.current = [...historyRef.current, current];
      }
      setCurrent(next);
      forwardRef.current = [];

      // Update recent list (keep unique, most recent first, max 20)
      recentRef.current = [
        next,
        ...recentRef.current.filter((r) => r.id !== next.id),
      ].slice(0, 20);

      forceUpdate({});
    },
    [current]
  );

  const back = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;

    if (current) {
      forwardRef.current = [...forwardRef.current, current];
    }
    setCurrent(prev);
    forceUpdate({});
  }, [current]);

  const forward = useCallback(() => {
    const nxt = forwardRef.current.pop();
    if (!nxt) return;

    if (current) {
      historyRef.current = [...historyRef.current, current];
    }
    setCurrent(nxt);
    forceUpdate({});
  }, [current]);

  const clear = useCallback(() => {
    setCurrent(null);
    historyRef.current = [];
    forwardRef.current = [];
    forceUpdate({});
  }, []);

  const breadcrumbs = useMemo(() => {
    const items = [...historyRef.current];
    const makeHandler = (idx: number) => () => {
      const target = items[idx];
      if (!target) return;

      // Move current and later history into forward stack
      const later = items.slice(idx + 1);
      const former = items.slice(0, idx);

      if (current) {
        forwardRef.current = [...forwardRef.current, current, ...later];
      } else {
        forwardRef.current = [...forwardRef.current, ...later];
      }

      historyRef.current = former;
      setCurrent(target);
      forceUpdate({});
    };

    const result: WikiBreadcrumb[] = items.map((st, i) => ({
      label: st.label || `${st.type}:${st.id.slice(0, 8)}`,
      onClick: makeHandler(i),
    }));

    // Add current item without onClick
    if (current) {
      result.push({
        label: current.label || `${current.type}:${current.id.slice(0, 8)}`,
      });
    }

    return result;
  }, [current]);

  const canGoBack = historyRef.current.length > 0;
  const canGoForward = forwardRef.current.length > 0;

  return {
    current,
    history: historyRef.current,
    forwardStack: forwardRef.current,
    recent: recentRef.current,
    breadcrumbs,
    navigateTo,
    back,
    forward,
    clear,
    canGoBack,
    canGoForward,
  };
}

export default useWikiNavigation;
