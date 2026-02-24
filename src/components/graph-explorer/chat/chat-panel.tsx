/**
 * ChatPanel - Agent chat interface
 * Composes header, message list, error banner, and input.
 * Reads all state and handlers from ChatContext (must be inside ChatProvider).
 */
"use client";

import React, { useCallback, useEffect, useState } from "react";

import { MessageSquare } from "lucide-react";

import { cn } from "@/lib/cn";

import { border } from "../select-panel/select-panel-constants";
import { useChat } from "./chat-context";
import { ChatInput } from "./chat-input";
import { ChatMessageList } from "./chat-message-list";

const MOBILE_BREAKPOINT = 768;

/**
 * ChatPanel - Agent chat interface
 * Composes header, message list, error banner, and input.
 * Reads all state and handlers from ChatContext (must be inside ChatProvider).
 */

export function ChatPanel() {
  const {
    agentId,
    agentName,
    messages,
    isSending,
    mode,
    error,
    sendMessage,
    setMode,
    clearError,
  } = useChat();

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
      await sendMessage(trimmedValue);
    } catch {
      // Error is handled by context / toast
    }
  }, [inputValue, isSending, agentId, sendMessage]);

  const handleClose = useCallback(() => {
    setMode("none");
  }, [setMode]);

  if (mode === "none") {
    return null;
  }

  const panelContent = (
    <>
      {!isExpanded && (
        <button
          onClick={() => setMode("chat")}
          className="w-full h-full flex items-center justify-center rounded-lg bg-primary text-primary-content hover:bg-primary/90 transition-colors"
          aria-label="Open chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {isExpanded && (
        <>
          <div className="flex items-center justify-between p-3 border-b border-[#333333] shrink-0">
            <span className="font-medium text-sm text-white truncate min-w-0">
              {agentName || "Agent Chat"}
            </span>
            <button
              onClick={handleClose}
              className="btn btn-ghost btn-xs btn-square text-white/80 hover:text-white hover:bg-white/10 shrink-0"
              aria-label="Close chat"
            >
              —
            </button>
          </div>

          <ChatMessageList
            agentId={agentId}
            messages={messages}
            isSending={isSending}
            onSendMessage={sendMessage}
          />
          {error && (
            <div className="px-3 py-2 bg-error/10 border-t border-error/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-error">{error}</span>
                <button
                  onClick={clearError}
                  className="text-xs text-error hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
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
            "shadow-xl w-full max-w-[calc(100vw-2rem)] h-full"
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
        "transition-all duration-200"
      )}
    >
      {panelContent}
    </div>
  );
}

export default ChatPanel;
