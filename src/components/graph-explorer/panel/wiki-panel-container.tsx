/**
 * WikiPanelContainer
 * Draggable, minimizable, closeable wrapper for WikiPanel. Can be placed anywhere.
 */

"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { X, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { WikiPanel, type WikiPanelProps, type WikiNodeData, type WikiEdgeData } from "./wiki-panel";

export type { WikiNodeData, WikiEdgeData };

const DEFAULT_WIDTH = 360;
const DEFAULT_HEIGHT = 480;
const MIN_LEFT = 0;
const MIN_TOP = 0;

/** Offset from the right edge when placing the panel in the top-right corner (px). */
const OFFSET_RIGHT = 64;
/** Offset from the top edge when placing the panel in the top-right corner (px). */
const OFFSET_TOP = 94;

export interface WikiPanelContainerProps extends WikiPanelProps {
  /** Initial position (left in px). If not set, derived from viewport. */
  defaultLeft?: number;
  /** Initial position (top in px). If not set, derived from viewport. */
  defaultTop?: number;
  /** Optional class for the container. */
  className?: string;
}

export function WikiPanelContainer({
  defaultLeft,
  defaultTop,
  className,
  ...wikiPanelProps
}: WikiPanelContainerProps) {
  const [position, setPosition] = useState(() => ({
    left: defaultLeft ?? (typeof window !== "undefined" ? Math.max(MIN_LEFT, window.innerWidth - DEFAULT_WIDTH - OFFSET_RIGHT) : 100),
    top: defaultTop ?? OFFSET_TOP,
  }));
  const [isMinimized, setIsMinimized] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default position on mount (for SSR-safe initial)
  useEffect(() => {
    if (defaultLeft !== undefined && defaultTop !== undefined) return;
    setPosition((prev) => {
      if (typeof window === "undefined") return prev;
      const left = defaultLeft ?? Math.max(MIN_LEFT, window.innerWidth - DEFAULT_WIDTH - OFFSET_RIGHT);
      const top = defaultTop ?? OFFSET_TOP;
      return { left, top };
    });
  }, [defaultLeft, defaultTop]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-drag-handle]") || target.closest("button")) return;
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startLeft: position.left,
        startTop: position.top,
      };
      containerRef.current?.setPointerCapture(e.pointerId);
    },
    [position]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    const { startX, startY, startLeft, startTop } = dragRef.current;
    const newLeft = Math.max(MIN_LEFT, startLeft + (e.clientX - startX));
    const newTop = Math.max(MIN_TOP, startTop + (e.clientY - startY));
    setPosition({ left: newLeft, top: newTop });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragRef.current) {
      containerRef.current?.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  }, []);

  const handleToggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const { enabled, onClose } = wikiPanelProps;

  if (!enabled || (!wikiPanelProps.node && !wikiPanelProps.edge)) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn("fixed z-100 flex flex-col rounded-lg shadow-xl border border-base-300 bg-base-100 overflow-hidden", className)}
      style={{
        left: position.left,
        top: position.top,
        width: DEFAULT_WIDTH,
        maxWidth: `calc(100vw - ${OFFSET_RIGHT}px)`,
        height: isMinimized ? undefined : Math.min(DEFAULT_HEIGHT, typeof window !== "undefined" ? window.innerHeight - position.top - OFFSET_TOP : DEFAULT_HEIGHT),
        maxHeight: isMinimized ? undefined : `calc(100vh - ${OFFSET_TOP}px)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Header bar: drag handle + title area + minimize/maximize + close */}
      <div
        data-drag-handle
        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-base-300 bg-base-200 cursor-grab active:cursor-grabbing select-none"
      >
        <span className="text-sm font-medium truncate flex-1 min-w-0">
          {wikiPanelProps.edge
            ? wikiPanelProps.edge.label || wikiPanelProps.edge.relation_type || "Relationship"
            : wikiPanelProps.node?.name || wikiPanelProps.node?.label || wikiPanelProps.node?.uuid?.slice(0, 8) || "Node"}
        </span>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleMinimize}
            className="btn btn-ghost btn-xs btn-square"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-square"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <WikiPanel {...wikiPanelProps} />
        </div>
      )}
    </div>
  );
}

export default WikiPanelContainer;
