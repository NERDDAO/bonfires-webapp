/**
 * ChatPanel - Agent chat interface
 * Composes header, message list, error banner, and input.
 */
"use client";

import React, { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/cn";

import { ChatErrorBanner } from "./chat-error-banner";
import { ChatInput } from "./chat-input";
import { ChatMessageList } from "./chat-message-list";
import { ChatPanelCollapsed } from "./chat-panel-collapsed";
import { ChatPanelHeader } from "./chat-panel-header";
import type { ChatPanelProps } from "./types";
import { border } from "../select-panel/select-panel-constants";

/**
 * ChatPanel - Agent chat interface
 * Composes header, message list, error banner, and input.
 */

const MOBILE_BREAKPOINT = 768;

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
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined"
      ? window.innerWidth < MOBILE_BREAKPOINT
      : false
  );
  const isExpanded = mode === "chat";

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = () => setIsMobile(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

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

  const panelContent = (
    <>
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
            onSendMessage={onSendMessage}
          />
          {error && <ChatErrorBanner error={error} onDismiss={onClearError} />}
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
    </>
  );

  if (isMobile && isExpanded) {
    return (
      <div
        className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={cn(
            "flex flex-col overflow-hidden",
            border,
            "shadow-xl w-full max-w-[calc(100vw-2rem)] h-full",
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
      className={cn(
        "fixed bottom-4 right-4 z-30",
        "flex flex-col overflow-hidden",
        border,
        "shadow-xl",
        isExpanded ? "w-96 h-[500px]" : "w-12 h-12",
        "transition-all duration-200",
        className
      )}
    >
      {panelContent}
    </div>
  );
}

export default ChatPanel;
