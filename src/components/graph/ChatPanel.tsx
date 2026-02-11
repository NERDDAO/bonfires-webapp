/**
 * ChatPanel Component
 * Chat interface for interacting with AI agents in the graph explorer
 */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import type { PanelMode } from "@/hooks";
import {
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  Send,
  X,
} from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * ChatPanel Component
 * Chat interface for interacting with AI agents in the graph explorer
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatPanelProps {
  /** Agent ID for the chat */
  agentId?: string;
  /** Agent name for display */
  agentName?: string;
  /** Chat history messages */
  messages: ChatMessage[];
  /** Whether a message is being sent */
  isSending: boolean;
  /** Current panel mode */
  mode: PanelMode;
  /** Error message */
  error?: string | null;
  /** Callback to send a message */
  onSendMessage: (content: string) => Promise<void>;
  /** Callback to change panel mode */
  onModeChange: (mode: PanelMode) => void;
  /** Callback to clear error */
  onClearError?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChatPanel - Agent chat interface
 */
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (mode === "chat") {
      inputRef.current?.focus();
    }
  }, [mode]);

  // Handle send message
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

  // Handle key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Close handler
  const handleClose = useCallback(() => {
    onModeChange("none");
  }, [onModeChange]);

  // Don't render if mode is none
  if (mode === "none") {
    return null;
  }

  const isExpanded = mode === "chat";

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-30",
        "flex flex-col",
        "bg-base-100 rounded-lg shadow-xl border border-base-300",
        isExpanded ? "w-96 h-[500px]" : "w-12 h-12",
        "transition-all duration-200",
        className
      )}
    >
      {/* Collapsed state - just a button */}
      {!isExpanded && (
        <button
          onClick={() => onModeChange("chat")}
          className="w-full h-full flex items-center justify-center rounded-lg bg-primary text-primary-content hover:bg-primary/90 transition-colors"
          aria-label="Open chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {/* Expanded state */}
      {isExpanded && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-base-300 shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">
                {agentName || "Agent Chat"}
              </span>
              {agentId && (
                <span className="badge badge-ghost badge-xs">Active</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onModeChange("none")}
                className="btn btn-ghost btn-xs btn-square"
                aria-label="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="btn btn-ghost btn-xs btn-square"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* No agent selected */}
            {!agentId && (
              <div className="flex items-center justify-center h-full text-center text-base-content/50">
                <p className="text-sm">Select an agent to start chatting</p>
              </div>
            )}

            {/* Empty state */}
            {agentId && messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-center text-base-content/50">
                <p className="text-sm">
                  Talk to this bonfire...
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col gap-1",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                <span className="text-xs text-base-content/40 px-1">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}

            {/* Typing indicator */}
            {isSending && (
              <div className="flex items-start">
                <div className="bg-base-200 rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-base-content/50" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 bg-error/10 border-t border-error/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-error">{error}</span>
                {onClearError && (
                  <button
                    onClick={onClearError}
                    className="text-xs text-error hover:underline"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-base-300 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  agentId ? "Type a message..." : "Select an agent first"
                }
                disabled={!agentId || isSending}
                rows={1}
                className={cn(
                  "textarea textarea-bordered flex-1 text-sm",
                  "min-h-[40px] max-h-[120px] resize-none",
                  "focus:textarea-primary"
                )}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending || !agentId}
                className="btn btn-primary btn-sm btn-square"
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Floating chat button for collapsed state
 */
export function FloatingChatButton({
  mode,
  onToggle,
  className,
}: {
  mode: PanelMode;
  onToggle: () => void;
  className?: string;
}) {
  // Only show when chat is closed
  if (mode !== "none") {
    return null;
  }

  return (
    <button
      onClick={onToggle}
      className={cn(
        "fixed bottom-4 right-4 z-30",
        "w-14 h-14 rounded-full",
        "bg-primary text-primary-content",
        "shadow-lg hover:shadow-xl",
        "hover:scale-105 transition-all duration-200",
        "flex items-center justify-center",
        className
      )}
      aria-label="Open chat"
    >
      <MessageSquare className="w-6 h-6" />
    </button>
  );
}

export default ChatPanel;
