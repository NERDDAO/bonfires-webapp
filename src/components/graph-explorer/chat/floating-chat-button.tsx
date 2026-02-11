/**
 * Floating chat button for collapsed state (when chat is closed).
 * Uses primary Button from ui.
 */
"use client";

import React from "react";

import type { PanelMode } from "@/hooks";
import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import Image from "next/image";

/**
 * Floating chat button for collapsed state (when chat is closed).
 * Uses primary Button from ui.
 */

export interface FloatingChatButtonProps {
  mode: PanelMode;
  onToggle: () => void;
  className?: string;
}

export function FloatingChatButton({
  mode,
  onToggle,
  className,
}: FloatingChatButtonProps) {
  if (mode !== "none") {
    return null;
  }

  return (
    <Button
      variant="primary"
      onClick={onToggle}
      className="fixed bottom-4 right-4 z-30 hidden lg:flex"
      aria-label="Open chat"
      leftIcon="/icons/chat.svg"
    >
      Chat with the graph
    </Button>
  );
}
