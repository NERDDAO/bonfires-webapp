/**
 * ChatPanel - Agent chat interface
 * Composes header, message list, error banner, and input.
 */

"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { ChatPanelHeader } from "./chat-panel-header";
import { ChatMessageList } from "./chat-message-list";
import { ChatErrorBanner } from "./chat-error-banner";
import { ChatInput } from "./chat-input";
import { ChatPanelCollapsed } from "./chat-panel-collapsed";
import type { ChatPanelProps } from "./types";

export function ChatPanel({
  agentId,
  agentName,
  messages,
  isSending,
  mode,
  error,
  onSendMessage,
  onModeChange,
  onClearError,
  className,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const isExpanded = mode === "chat";

  const handleSend = useCallback(async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isSending || !agentId) return;

    setInputValue("");
    try {
      await onSendMessage(trimmedValue);
    } catch {
      // Error is handled by parent
    }
  }, [inputValue, isSending, agentId, onSendMessage]);

  const handleClose = useCallback(() => {
    onModeChange("none");
  }, [onModeChange]);

  if (mode === "none") {
    return null;
  }

  const panelBorder = "bg-[#181818]/80 border-[0.78px] border-[#333333] rounded-2xl";

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-30",
        "flex flex-col overflow-hidden",
        panelBorder,
        "shadow-xl",
        isExpanded ? "w-96 h-[500px]" : "w-12 h-12",
        "transition-all duration-200",
        className
      )}
    >
      {!isExpanded && (
        <ChatPanelCollapsed onOpen={() => onModeChange("chat")} />
      )}

      {isExpanded && (
        <>
          <ChatPanelHeader
            agentName={agentName}
            agentId={agentId}
            onClose={handleClose}
          />
          <ChatMessageList
            agentId={agentId}
            messages={messages}
            isSending={isSending}
          />
          {error && (
            <ChatErrorBanner
              error={error}
              onDismiss={onClearError}
            />
          )}
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            disabled={!agentId || isSending}
            isSending={isSending}
            hasAgent={!!agentId}
            autoFocus={isExpanded}
          />
        </>
      )}
    </div>
  );
}

export default ChatPanel;
