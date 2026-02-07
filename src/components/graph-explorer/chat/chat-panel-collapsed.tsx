/**
 * Collapsed chat panel - floating button to open chat
 */
"use client";

import React from "react";

import { MessageSquare } from "lucide-react";

/**
 * Collapsed chat panel - floating button to open chat
 */

export interface ChatPanelCollapsedProps {
  onOpen: () => void;
}

export function ChatPanelCollapsed({ onOpen }: ChatPanelCollapsedProps) {
  return (
    <button
      onClick={onOpen}
      className="w-full h-full flex items-center justify-center rounded-lg bg-primary text-primary-content hover:bg-primary/90 transition-colors"
      aria-label="Open chat"
    >
      <MessageSquare className="w-5 h-5" />
    </button>
  );
}
