/**
 * Chat messages list with empty states and typing indicator.
 *
 * Scroll behaviour:
 *  - When the user sends a message → scroll to the bottom so they
 *    see their message + the typing indicator.
 *  - When the assistant reply arrives → scroll just enough to show
 *    the **top** of the reply. The user then scrolls down manually.
 *  - If the user has scrolled up (reading history) → no auto-scroll.
 */
"use client";

import React, { useCallback, useEffect, useRef } from "react";

import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { ChatMessageBubble } from "./chat-message-bubble";
import type { ChatMessage } from "./types";
import { PRESET_PROMPT_TITLE, PRESET_PROMPTS } from "@/content/graph-explorer";

export interface ChatMessageListProps {
  agentId?: string;
  messages: ChatMessage[];
  isSending: boolean;
  onSendMessage?: (content: string) => void | Promise<void>;
}

/** Pixel threshold: user is considered "near bottom" when within this distance. */
const NEAR_BOTTOM_PX = 100;

export function ChatMessageList({
  agentId,
  messages,
  isSending,
  onSendMessage,
}: ChatMessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessageCountRef = useRef(messages.length);

  // Track whether the user is near the bottom of the scroll container.
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    isNearBottomRef.current =
      scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_PX;
  }, []);

  // Smart scroll when new messages arrive.
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const currentCount = messages.length;
    prevMessageCountRef.current = currentCount;

    // No new messages added → nothing to scroll for.
    if (currentCount <= prevCount || currentCount === 0) return;

    const lastMessage = messages[currentCount - 1];
    if (!lastMessage) return;

    if (lastMessage.role === "user") {
      // The user just sent a message – scroll to the very bottom so they see
      // their own message together with the upcoming typing indicator.
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (isNearBottomRef.current) {
      // An assistant reply arrived while the user was near the bottom –
      // scroll so the TOP of the reply is visible, not the absolute end.
      lastMessageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    // If the user has scrolled up, we intentionally do nothing.
  }, [messages]);

  // When the typing indicator appears, scroll to show it (user just sent).
  useEffect(() => {
    if (isSending && isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isSending]);

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-[#0f0f0f]"
    >
      {!agentId && (
        <div className="flex items-center justify-center h-full text-center text-white/60">
          <p className="text-sm">Select an agent to start chatting</p>
        </div>
      )}

      {agentId && messages.length === 0 && (
        <div className="flex flex-col justify-end h-full p-1 gap-2 text-white/60">
          <p className="text-sm">{PRESET_PROMPT_TITLE}</p>
          {onSendMessage && !isSending && (
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_PROMPTS.map((text) => (
                <Badge
                  key={text}
                  variant="outline"
                  className="cursor-pointer hover:bg-white/10 transition-colors text-sm"
                  onClick={() => onSendMessage(text)}
                >
                  {text}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {messages.map((message, index) => (
        <div
          key={message.id}
          ref={index === messages.length - 1 ? lastMessageRef : undefined}
        >
          <ChatMessageBubble message={message} />
        </div>
      ))}

      {isSending && (
        <div className="flex items-start">
          <div className="bg-[#1C1D21] rounded-xl px-4 py-3 border border-transparent">
            <Loader2 className="w-4 h-4 animate-spin text-white/60" />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
