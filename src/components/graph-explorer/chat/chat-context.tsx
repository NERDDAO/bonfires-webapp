/**
 * Chat context and provider
 * Owns chat UI state (messages, sending, error, open/closed) and send logic.
 * Parent supplies agent identity and a callback to get current graph context for sends.
 */
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { PanelMode } from "@/hooks";
import type { GraphStatePayload } from "@/types";
import { useSendChatMessage } from "@/hooks";
import { toast } from "@/components/common";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatGraphContext {
  centerNodeUuid: string | null;
  graphState: GraphStatePayload;
}

export interface ChatProviderProps {
  children: React.ReactNode;
  /** Current agent ID (undefined when none selected) */
  agentId?: string;
  /** Agent display name */
  agentName?: string;
  /** Bonfire ID for chat API context */
  bonfireId?: string;
  /** Returns current graph state for the send request; called when user sends a message */
  getGraphContext: () => ChatGraphContext;
  /** Optional: called when provider mounts so parent can get openChat for overlays/buttons */
  onReady?: (api: { openChat: () => void }) => void;
}

export interface ChatContextValue {
  agentId: string | undefined;
  agentName: string | undefined;
  messages: ChatMessage[];
  isSending: boolean;
  mode: PanelMode;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  setMode: (mode: PanelMode) => void;
  toggleChat: () => void;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  children,
  agentId,
  agentName,
  bonfireId,
  getGraphContext,
  onReady,
}: ChatProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const chatMutation = useSendChatMessage();

  const mode: PanelMode = isOpen ? "chat" : "none";
  const error = chatMutation.error?.message ?? null;

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  useEffect(() => {
    onReady?.({ openChat });
  }, [onReady, openChat]);

  useEffect(() => {
    setMessages([]);
  }, [agentId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!agentId) {
        throw new Error("No agent selected");
      }

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const { centerNodeUuid, graphState } = getGraphContext();
        const response = await chatMutation.mutateAsync({
          agentId,
          message: content,
          bonfireId,
          centerNodeUuid: centerNodeUuid ?? undefined,
          graphMode: "static",
          context: { graphState },
        });

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.reply ?? "No response",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        toast.error("Failed to send message");
        throw new Error("Failed to send message");
      }
    },
    [agentId, bonfireId, getGraphContext, chatMutation]
  );

  const setMode = useCallback((next: PanelMode) => {
    setIsOpen(next === "chat");
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearError = useCallback(() => {
    chatMutation.reset();
  }, [chatMutation]);

  const value = useMemo<ChatContextValue>(
    () => ({
      agentId,
      agentName,
      messages,
      isSending: chatMutation.isPending,
      mode,
      error,
      sendMessage,
      setMode,
      toggleChat,
      clearError,
    }),
    [
      agentId,
      agentName,
      messages,
      chatMutation.isPending,
      mode,
      error,
      sendMessage,
      setMode,
      toggleChat,
      clearError,
    ]
  );

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return ctx;
}

export function useChatOptional(): ChatContextValue | null {
  return useContext(ChatContext);
}
