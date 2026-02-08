/**
 * Single chat message bubble
 * Styled like recent activity cards (episodes list).
 */
"use client";

import React from "react";

import { cn } from "@/lib/cn";

import type { ChatMessage as ChatMessageType } from "./types";

/**
 * Single chat message bubble
 * Styled like recent activity cards (episodes list).
 */

export interface ChatMessageBubbleProps {
  message: ChatMessageType;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "w-full max-w-[85%] rounded-xl p-4 text-left",
          isUser
            ? "bg-[#2D2E33] text-white border border-white/10"
            : "bg-[#1C1D21] text-white border border-transparent"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <span className="text-xs text-white/60 mt-2 block">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
