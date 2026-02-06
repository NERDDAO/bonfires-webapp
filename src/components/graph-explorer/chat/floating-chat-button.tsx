/**
 * Floating chat button for collapsed state (when chat is closed).
 * Uses primary Button from ui.
 */

"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import type { PanelMode } from "@/hooks";
import { Button } from "@/components/ui/button";

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
    >
      <MessageSquare className="w-6 h-6" />
    </Button>
  );
}
