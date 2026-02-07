/**
 * Chat panel header with agent name and close button
 * Styled like wiki-panel header (no icon, no active tag).
 */
"use client";

import React from "react";

/**
 * Chat panel header with agent name and close button
 * Styled like wiki-panel header (no icon, no active tag).
 */

export interface ChatPanelHeaderProps {
  agentName?: string;
  agentId?: string;
  onClose: () => void;
}

export function ChatPanelHeader({ agentName, onClose }: ChatPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b border-[#333333] shrink-0">
      <span className="font-medium text-sm text-white truncate min-w-0">
        {agentName || "Agent Chat"}
      </span>
      <button
        onClick={onClose}
        className="btn btn-ghost btn-xs btn-square text-white/80 hover:text-white hover:bg-white/10 shrink-0"
        aria-label="Close chat"
      >
        —
      </button>
    </div>
  );
}
