/**
 * useGraphExplorer Hook
 * Centralized state management for the graph explorer component
 */
"use client";

import { useReducer } from "react";

import type { GraphElement } from "@/lib/utils/sigma-adapter";
import { MOBILE_BREAKPOINT_PX } from "./useMediaQuery";

/**
 * useGraphExplorer Hook
 * Centralized state management for the graph explorer component
 */

// Panel modes
export type PanelMode = "none" | "chat" | "wiki";
export type WikiMode = "sidebar" | "full";

// Selection state
export interface SelectionState {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  userSelected: boolean;
  autoSelected: boolean;
}

// Panel state (wiki = right sidebar, chat = right panel or overlay)
export interface PanelState {
  /** Right panel: none, wiki, or chat */
  rightPanelMode: PanelMode;
  /** Floating chat overlay open/closed (synced when rightPanelMode === "chat") */
  chatOpen: boolean;
  wikiEnabled: boolean;
  wikiMode: WikiMode;
  /** Wiki panel container minimized (header only) vs expanded (contents visible) */
  wikiMinimized: boolean;
}

// Timeline state
export interface TimelineState {
  expanded: boolean;
  fallbackCenterId: string | null;
}

// Combined state
export interface GraphExplorerState {
  selection: SelectionState;
  panel: PanelState;
  timeline: TimelineState;
}

// Action types
export enum SelectionActionType {
  SELECT_NODE = "SELECT_NODE",
  SELECT_EDGE = "SELECT_EDGE",
  CLEAR_SELECTION = "CLEAR_SELECTION",
  SET_AUTO_SELECTED = "SET_AUTO_SELECTED",
}

export enum PanelActionType {
  SET_PANEL_MODE = "SET_PANEL_MODE",
  SET_CHAT_OPEN = "SET_CHAT_OPEN",
  SET_WIKI_ENABLED = "SET_WIKI_ENABLED",
  SET_WIKI_MODE = "SET_WIKI_MODE",
  SET_WIKI_MINIMIZED = "SET_WIKI_MINIMIZED",
  TOGGLE_WIKI = "TOGGLE_WIKI",
}

export enum TimelineActionType {
  TOGGLE_EXPANDED = "TOGGLE_EXPANDED",
  SET_FALLBACK_CENTER = "SET_FALLBACK_CENTER",
}

// Selection actions
type SelectionAction =
  | {
      type: SelectionActionType.SELECT_NODE;
      nodeId: string;
      userTriggered?: boolean;
    }
  | {
      type: SelectionActionType.SELECT_EDGE;
      edgeId: string;
      userTriggered?: boolean;
    }
  | { type: SelectionActionType.CLEAR_SELECTION }
  | { type: SelectionActionType.SET_AUTO_SELECTED; autoSelected: boolean };

// Panel actions
type PanelAction =
  | { type: PanelActionType.SET_PANEL_MODE; mode: PanelMode }
  | { type: PanelActionType.SET_CHAT_OPEN; open: boolean }
  | { type: PanelActionType.SET_WIKI_ENABLED; enabled: boolean }
  | { type: PanelActionType.SET_WIKI_MODE; mode: WikiMode }
  | { type: PanelActionType.SET_WIKI_MINIMIZED; minimized: boolean }
  | { type: PanelActionType.TOGGLE_WIKI };

// Timeline actions
type TimelineAction =
  | { type: TimelineActionType.TOGGLE_EXPANDED }
  | { type: TimelineActionType.SET_FALLBACK_CENTER; centerId: string | null };

// Reducers
function selectionReducer(
  state: SelectionState,
  action: SelectionAction
): SelectionState {
  switch (action.type) {
    case SelectionActionType.SELECT_NODE:
      return {
        ...state,
        selectedNodeId: action.nodeId || null,
        selectedEdgeId: null,
        userSelected: action.userTriggered ?? true,
        autoSelected: !action.userTriggered,
      };
    case SelectionActionType.SELECT_EDGE:
      return {
        ...state,
        selectedNodeId: null,
        selectedEdgeId: action.edgeId || null,
        userSelected: action.userTriggered ?? true,
        autoSelected: false,
      };
    case SelectionActionType.CLEAR_SELECTION:
      return {
        selectedNodeId: null,
        selectedEdgeId: null,
        userSelected: false,
        autoSelected: false,
      };
    case SelectionActionType.SET_AUTO_SELECTED:
      return {
        ...state,
        autoSelected: action.autoSelected,
      };
    default:
      return state;
  }
}

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case PanelActionType.SET_PANEL_MODE: {
      const mode = action.mode;
      return {
        ...state,
        rightPanelMode: mode,
        chatOpen: mode === "chat",
      };
    }
    case PanelActionType.SET_CHAT_OPEN:
      return { ...state, chatOpen: action.open };
    case PanelActionType.SET_WIKI_ENABLED:
      return { ...state, wikiEnabled: action.enabled };
    case PanelActionType.SET_WIKI_MODE:
      return { ...state, wikiMode: action.mode };
    case PanelActionType.SET_WIKI_MINIMIZED:
      return { ...state, wikiMinimized: action.minimized };
    case PanelActionType.TOGGLE_WIKI:
      return {
        ...state,
        wikiEnabled: !state.wikiEnabled,
        rightPanelMode: state.wikiEnabled ? "none" : "wiki",
      };
    default:
      return state;
  }
}

function timelineReducer(
  state: TimelineState,
  action: TimelineAction
): TimelineState {
  switch (action.type) {
    case TimelineActionType.TOGGLE_EXPANDED:
      return { ...state, expanded: !state.expanded };
    case TimelineActionType.SET_FALLBACK_CENTER:
      return { ...state, fallbackCenterId: action.centerId };
    default:
      return state;
  }
}

// Initial states
const initialSelectionState: SelectionState = {
  selectedNodeId: null,
  selectedEdgeId: null,
  userSelected: false,
  autoSelected: false,
};

function getInitialPanelState(): PanelState {
  // Open chat by default on desktop (viewport >= 768px)
  const isDesktop =
    typeof window !== "undefined" &&
    window.innerWidth >= MOBILE_BREAKPOINT_PX;

  return {
    rightPanelMode: "none",
    chatOpen: isDesktop,
    wikiEnabled: true,
    wikiMode: "sidebar",
    wikiMinimized: false,
  };
}

const initialTimelineState: TimelineState = {
  expanded: true,
  fallbackCenterId: null,
};

/**
 * Hook for managing graph explorer state
 */
export function useGraphExplorerState() {
  const [selection, dispatchSelection] = useReducer(
    selectionReducer,
    initialSelectionState
  );
  const [panel, dispatchPanel] = useReducer(
    panelReducer,
    getInitialPanelState()
  );
  const [timeline, dispatchTimeline] = useReducer(
    timelineReducer,
    initialTimelineState
  );

  return {
    state: {
      selection,
      panel,
      timeline,
    },
    actions: {
      dispatchSelection,
      dispatchPanel,
      dispatchTimeline,
    },
  };
}

/**
 * Helper to get node data from elements
 */
export function getNodeFromElements(
  elements: GraphElement[],
  nodeId: string | null
): GraphElement | null {
  if (!nodeId) return null;

  // Try with and without n: prefix
  const searchIds = [nodeId, `n:${nodeId}`, nodeId.replace(/^n:/, "")];

  for (const id of searchIds) {
    const element = elements.find((el) => el.data?.id === id);
    if (element) return element;
  }

  return null;
}

/**
 * Helper to get edge data from elements
 */
export function getEdgeFromElements(
  elements: GraphElement[],
  edgeId: string | null
): GraphElement | null {
  if (!edgeId) return null;
  return (
    elements.find(
      (el) => el.data?.id === edgeId && el.data?.source && el.data?.target
    ) ?? null
  );
}

export default useGraphExplorerState;
