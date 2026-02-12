/**
 * Single chat message bubble
 * Styled like recent activity cards (episodes list).
 * Assistant messages are rendered as markdown; user messages stay plain text.
 */
"use client";

import React from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/cn";

import type { ChatMessage as ChatMessageType } from "./types";

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
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="chat-markdown text-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="my-1.5 leading-relaxed">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-white/90">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="my-2 ml-4 list-disc space-y-1 text-white/90">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2 ml-4 list-decimal space-y-1 text-white/90">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                h1: ({ children }) => (
                  <h1 className="text-base font-bold mt-3 mb-1.5">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-[0.9375rem] font-bold mt-3 mb-1.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                  >
                    {children}
                  </a>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="rounded bg-white/10 px-1 py-0.5 text-xs text-white/90">
                      {children}
                    </code>
                  ) : (
                    <code className={cn("text-xs", className)} {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="my-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-2 border-l-2 border-white/20 pl-3 text-white/70 italic">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-3 border-white/10" />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
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
