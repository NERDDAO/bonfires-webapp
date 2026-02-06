/**
 * Chat messages list with empty states and typing indicator
 */

"use client";

import React, { useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ChatMessageBubble } from "./chat-message-bubble";
import type { ChatMessage } from "./types";

export interface ChatMessageListProps {
  agentId?: string;
  messages: ChatMessage[];
  isSending: boolean;
}

export function ChatMessageList({
  agentId,
  messages,
  isSending,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-[#0f0f0f]">
      {!agentId && (
        <div className="flex items-center justify-center h-full text-center text-white/60">
          <p className="text-sm">Select an agent to start chatting</p>
        </div>
      )}

      {agentId && messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-center text-white/60">
          <p className="text-sm">Send a message to start the conversation</p>
        </div>
      )}

      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
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
