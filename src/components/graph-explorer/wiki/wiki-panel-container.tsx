/**
 * WikiPanelContainer
 * Draggable, minimizable, closeable wrapper for WikiPanel. Can be placed anywhere.
 */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { Maximize2, Minimize2, X } from "lucide-react";

import { cn } from "@/lib/cn";

import {
  type WikiEdgeData,
  type WikiNodeData,
  WikiPanel,
  type WikiPanelProps,
} from "./wiki-panel";
import { border } from "../select-panel/select-panel-constants";

/**
 * WikiPanelContainer
 * Draggable, minimizable, closeable wrapper for WikiPanel. Can be placed anywhere.
 */

export type { WikiNodeData, WikiEdgeData };

const SCALE_FACTOR = 1.25;
const DEFAULT_WIDTH = 360*SCALE_FACTOR;
const DEFAULT_HEIGHT = 480*SCALE_FACTOR;
const MIN_LEFT = 0;
const MIN_TOP = 0;

/** Offset from the right edge when placing the panel in the top-right corner (px). */
const OFFSET_RIGHT = 64;
/** Offset from the top edge when placing the panel in the top-right corner (px). */
const OFFSET_TOP = 94;

const MOBILE_BREAKPOINT = 768;

export interface WikiPanelContainerProps extends WikiPanelProps {
  /** Initial position (left in px). If not set, derived from viewport. */
  defaultLeft?: number;
  /** Initial position (top in px). If not set, derived from viewport. */
  defaultTop?: number;
  /** Optional class for the container. */
  className?: string;
  /** Controlled minimized state (header only vs contents visible). When set, onMinimizedChange must be provided. */
  minimized?: boolean;
  /** Called when user toggles minimize. Required when minimized is controlled. */
  onMinimizedChange?: (minimized: boolean) => void;
}

export function WikiPanelContainer({
  defaultLeft,
  defaultTop,
  className,
  minimized: controlledMinimized,
  onMinimizedChange,
  ...wikiPanelProps
}: WikiPanelContainerProps) {
  const [position, setPosition] = useState(() => ({
    left:
      defaultLeft ??
      (typeof window !== "undefined"
        ? Math.max(MIN_LEFT, window.innerWidth - DEFAULT_WIDTH - OFFSET_RIGHT)
        : 100),
    top: defaultTop ?? OFFSET_TOP,
  }));
  const [internalMinimized, setInternalMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined"
      ? window.innerWidth < MOBILE_BREAKPOINT
      : false
  );
  const isControlled = controlledMinimized !== undefined;
  const isMinimized = isControlled ? controlledMinimized : internalMinimized;
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = () => setIsMobile(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Default position on mount (for SSR-safe initial)
  useEffect(() => {
    if (defaultLeft !== undefined && defaultTop !== undefined) return;
    setPosition((prev) => {
      if (typeof window === "undefined") return prev;
      const left =
        defaultLeft ??
        Math.max(MIN_LEFT, window.innerWidth - DEFAULT_WIDTH - OFFSET_RIGHT);
      const top = defaultTop ?? OFFSET_TOP;
      return { left, top };
    });
  }, [defaultLeft, defaultTop]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isMobile) return;
      const target = e.target as HTMLElement;
      if (!target.closest("[data-drag-handle]") || target.closest("button"))
        return;
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startLeft: position.left,
        startTop: position.top,
      };
      containerRef.current?.setPointerCapture(e.pointerId);
    },
    [position, isMobile]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    const { startX, startY, startLeft, startTop } = dragRef.current;
    const newLeft = Math.max(MIN_LEFT, startLeft + (e.clientX - startX));
    const maxTop =
      typeof window !== "undefined"
        ? window.innerHeight - DEFAULT_HEIGHT
        : Infinity;
    const newTop = Math.max(
      MIN_TOP,
      Math.min(maxTop, startTop + (e.clientY - startY))
    );
    setPosition({ left: newLeft, top: newTop });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragRef.current) {
      containerRef.current?.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  }, []);

  const handleToggleMinimize = useCallback(() => {
    if (isControlled && onMinimizedChange) {
      onMinimizedChange(!isMinimized);
    } else {
      setInternalMinimized((prev) => !prev);
    }
  }, [isControlled, isMinimized, onMinimizedChange]);

  const handleSearchAroundNode = useCallback(
    (nodeUuid: string) => {
      wikiPanelProps.onSearchAroundNode?.(nodeUuid);
      if (isMobile) {
        wikiPanelProps.onClose?.();
      }
    },
    [wikiPanelProps.onSearchAroundNode, wikiPanelProps.onClose, isMobile]
  );

  const { enabled, onClose } = wikiPanelProps;

  if (!enabled || (!wikiPanelProps.node && !wikiPanelProps.edge)) {
    return null;
  }

  const headerContent = (
    <div
      data-drag-handle
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2 select-none",
        !isMobile && "cursor-grab active:cursor-grabbing"
      )}
    >
      <span className="text-sm font-medium truncate flex-1 min-w-0">
        {wikiPanelProps.edge
          ? wikiPanelProps.edge.label ||
            wikiPanelProps.edge.relation_type ||
            "Relationship"
          : wikiPanelProps.node?.name ||
            wikiPanelProps.node?.label ||
            wikiPanelProps.node?.uuid?.slice(0, 8) ||
            "Node"}
      </span>
      <div className="flex items-center gap-0.5 shrink-0">
        {!isMobile && (
          <button
            type="button"
            onClick={handleToggleMinimize}
            className="btn btn-ghost btn-xs btn-square"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
        )}
        {!isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-square"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  const showBody = isMobile ? true : !isMinimized;

  const panelContent = (
    <>
      {headerContent}
      {showBody && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <WikiPanel
            {...wikiPanelProps}
            isMobile={isMobile}
            onSearchAroundNode={handleSearchAroundNode}
          />
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
        role="dialog"
        aria-modal="true"
      >
        <div
          ref={containerRef}
          className={cn(
            "flex flex-col shadow-xl overflow-hidden w-full max-w-[calc(100vw-2rem)] h-full",
            border,
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {panelContent}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed z-100 flex flex-col rounded-lg shadow-xl border border-base-300 bg-base-100 overflow-hidden",
        border,
        className
      )}
      style={{
        left: position.left,
        top: position.top,
        width: DEFAULT_WIDTH,
        maxWidth: `calc(100vw - ${OFFSET_RIGHT}px)`,
        height: isMinimized ? undefined : DEFAULT_HEIGHT,
        maxHeight: isMinimized ? undefined : `calc(100vh - ${OFFSET_TOP}px)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {panelContent}
    </div>
  );
}

export default WikiPanelContainer;
