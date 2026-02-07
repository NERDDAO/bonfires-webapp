/**
 * NodeContextMenu Component
 * Context menu for graph nodes with actions including "Create Data Room"
 */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { Database, Expand, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * NodeContextMenu Component
 * Context menu for graph nodes with actions including "Create Data Room"
 */

export interface NodeData {
  id: string;
  label?: string;
  name?: string;
  type?: "episode" | "entity" | "unknown";
  node_type?: "episode" | "entity" | "unknown";
  [key: string]: unknown;
}

export interface NodeContextMenuProps {
  /** Whether the context menu is visible */
  visible: boolean;
  /** Position coordinates for the menu */
  position: { x: number; y: number };
  /** Data of the selected node */
  nodeData: NodeData;
  /** Whether the user has a connected wallet */
  isWalletConnected?: boolean;
  /** Callback when Add triplet button is clicked */
  onAdd?: (nodeData: NodeData) => void;
  /** Callback when Expand button is clicked */
  onExpand: (nodeData: NodeData) => void;
  /** Callback when Delete button is clicked */
  onDelete: (nodeData: NodeData) => void;
  /** Callback when Create Data Room is clicked */
  onCreateDataRoom?: (nodeData: NodeData) => void;
  /** Callback when menu should close */
  onClose: () => void;
}

/**
 * NodeContextMenu - Circular context menu for node actions
 */
export function NodeContextMenu({
  visible,
  position,
  nodeData,
  isWalletConnected = false,
  onAdd,
  onExpand,
  onDelete,
  onCreateDataRoom,
  onClose,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Determine node type
  const isEpisode =
    nodeData.type === "episode" || nodeData.node_type === "episode";

  // Calculate adjusted position to stay within viewport bounds
  useEffect(() => {
    if (!visible || !menuRef.current) {
      setAdjustedPosition(position);
      return;
    }

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = position.x;
    let adjustedY = position.y;

    // Ensure menu stays within horizontal bounds
    const menuWidth = 160; // Approximate width
    if (adjustedX + menuWidth / 2 > viewportWidth) {
      adjustedX = viewportWidth - menuWidth / 2 - 8;
    }
    if (adjustedX - menuWidth / 2 < 0) {
      adjustedX = menuWidth / 2 + 8;
    }

    // Ensure menu stays within vertical bounds
    const menuHeight = 160; // Approximate height
    if (adjustedY + menuHeight / 2 > viewportHeight) {
      adjustedY = viewportHeight - menuHeight / 2 - 8;
    }
    if (adjustedY - menuHeight / 2 < 0) {
      adjustedY = menuHeight / 2 + 8;
    }

    setAdjustedPosition({ x: adjustedX, y: adjustedY });
  }, [visible, position]);

  // Handle click outside to close menu
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [visible, onClose]);

  // Action handlers
  const handleAdd = useCallback(() => {
    onAdd?.(nodeData);
    onClose();
  }, [onAdd, nodeData, onClose]);

  const handleExpand = useCallback(() => {
    onExpand(nodeData);
    onClose();
  }, [onExpand, nodeData, onClose]);

  const handleDelete = useCallback(() => {
    onDelete(nodeData);
    onClose();
  }, [onDelete, nodeData, onClose]);

  const handleCreateDataRoom = useCallback(() => {
    if (isWalletConnected && onCreateDataRoom) {
      onCreateDataRoom(nodeData);
      onClose();
    }
  }, [isWalletConnected, onCreateDataRoom, nodeData, onClose]);

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  const nodeLabel = nodeData.label || nodeData.name || nodeData.id.slice(0, 8);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40"
        aria-hidden="true"
      />

      {/* Context Menu */}
      <div
        ref={menuRef}
        role="menu"
        aria-label={`Context menu for ${nodeLabel}`}
        tabIndex={-1}
        className="fixed z-50"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Node label in center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-base-content/60 text-center max-w-[60px] truncate pointer-events-none">
          {nodeLabel}
        </div>

        {/* Add Button - Top (only for entities) */}
        {!isEpisode && onAdd && (
          <button
            role="menuitem"
            aria-label={`Add relationship to ${nodeLabel}`}
            onClick={handleAdd}
            className={cn(
              "absolute w-12 h-12 rounded-full",
              "bg-info hover:bg-info/80 text-info-content",
              "flex items-center justify-center",
              "transition-all duration-200 hover:scale-110",
              "focus:outline-none focus:ring-2 focus:ring-info/50",
              "shadow-lg hover:shadow-xl"
            )}
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -70px)",
            }}
            title="Add triplet relationship"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}

        {/* Expand Button - Left */}
        <button
          role="menuitem"
          aria-label={`Expand relationships from ${nodeLabel}`}
          onClick={handleExpand}
          className={cn(
            "absolute w-12 h-12 rounded-full",
            "bg-success hover:bg-success/80 text-success-content",
            "flex items-center justify-center",
            "transition-all duration-200 hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-success/50",
            "shadow-lg hover:shadow-xl"
          )}
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(calc(-50% - 55px), 20px)",
          }}
          title="Expand relationships"
        >
          <Expand className="w-5 h-5" />
        </button>

        {/* Delete Button - Right */}
        <button
          role="menuitem"
          aria-label={`Delete ${nodeLabel} from graph`}
          onClick={handleDelete}
          className={cn(
            "absolute w-12 h-12 rounded-full",
            "bg-error hover:bg-error/80 text-error-content",
            "flex items-center justify-center",
            "transition-all duration-200 hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-error/50",
            "shadow-lg hover:shadow-xl"
          )}
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(calc(-50% + 55px), 20px)",
          }}
          title="Remove from graph"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        {/* Create Data Room Button - Bottom */}
        {onCreateDataRoom && (
          <div className="relative">
            <button
              role="menuitem"
              aria-label={
                isWalletConnected
                  ? `Create data room from ${nodeLabel}`
                  : "Connect wallet to create data room"
              }
              onClick={handleCreateDataRoom}
              disabled={!isWalletConnected}
              className={cn(
                "absolute w-12 h-12 rounded-full",
                "flex items-center justify-center",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2",
                "shadow-lg",
                isWalletConnected
                  ? "bg-primary hover:bg-primary/80 text-primary-content hover:scale-110 focus:ring-primary/50 hover:shadow-xl"
                  : "bg-base-300 text-base-content/40 cursor-not-allowed"
              )}
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, 55px)",
              }}
              title={
                isWalletConnected
                  ? "Create Data Room"
                  : "Connect wallet to create data room"
              }
            >
              <Database className="w-5 h-5" />
            </button>

            {/* Tooltip for disabled state */}
            {!isWalletConnected && (
              <div
                className="absolute text-xs text-base-content/60 text-center whitespace-nowrap pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, 110px)",
                }}
              >
                Connect wallet to enable
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default NodeContextMenu;
