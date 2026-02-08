/**
 * useSendChatMessage Hook
 *
 * React Query mutation hook for sending chat messages to agents.
 * Integrates with localStorage chat history for persistence.
 */
"use client";

import type {
  ChatContextPayload,
  ChatMessage,
  ChatRequest,
  ChatResponse,
} from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";

import { apiClient } from "@/lib/api/client";
import {
  type ChatMessage as StoredChatMessage,
  addChatMessage,
  getChatHistory,
} from "@/lib/storage/chatHistory";

/**
 * useSendChatMessage Hook
 *
 * React Query mutation hook for sending chat messages to agents.
 * Integrates with localStorage chat history for persistence.
 */

interface SendChatMessageParams {
  /** The agent ID to chat with */
  agentId: string;
  /** The message content */
  message: string;
  /** Optional bonfire ID for context */
  bonfireId?: string;
  /** Optional graph mode */
  graphMode?: "adaptive" | "static" | "dynamic" | "none";
  /** Optional center node UUID for graph context */
  centerNodeUuid?: string;
  /** Optional graph ID for state continuity */
  graphId?: string;
  /** Optional additional context for the agent */
  context?: ChatContextPayload;
  /** Include chat history from localStorage */
  includeHistory?: boolean;
}

interface SendChatMessageResult {
  reply: string;
  userMessage: StoredChatMessage;
  assistantMessage: StoredChatMessage;
  graphAction?: string;
  graphData?: unknown;
  newGraphId?: string;
}

/**
 * Convert stored chat messages to API format
 */
function convertToApiFormat(messages: StoredChatMessage[]): ChatMessage[] {
  return messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "assistant",
    content: msg.content,
  }));
}

/**
 * Hook for sending chat messages to agents
 */
export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: SendChatMessageParams
    ): Promise<SendChatMessageResult> => {
      const {
        agentId,
        message,
        bonfireId,
        graphMode = "adaptive",
        centerNodeUuid,
        graphId,
        context,
        includeHistory = true,
      } = params;

      // Get chat history from localStorage
      const history = includeHistory ? getChatHistory(agentId) : [];
      const chatHistory = convertToApiFormat(history);

      // Prepare the request
      const request: ChatRequest = {
        message,
        chat_history: chatHistory,
        agent_id: agentId,
        graph_mode: graphMode,
        center_node_uuid: centerNodeUuid,
        graph_id: graphId,
        bonfire_id: bonfireId,
        context,
      };

      // Create user message for storage
      const userMessage: StoredChatMessage = {
        id: uuidv4(),
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };

      // Save user message immediately
      addChatMessage(agentId, userMessage);

      try {
        // Send to API
        const response = await apiClient.post<ChatResponse>(
          `/api/agents/${agentId}/chat`,
          request
        );

        // Create assistant message
        const assistantMessage: StoredChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: response.reply,
          timestamp: new Date().toISOString(),
        };

        // Save assistant response
        addChatMessage(agentId, assistantMessage);

        return {
          reply: response.reply,
          userMessage,
          assistantMessage,
          graphAction: response.graph_action,
          graphData: response.graph_data,
          newGraphId: response.new_graph_id,
        };
      } catch (error) {
        // Note: User message is already saved. Consider removing it on error
        // or keeping it for retry purposes
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      // Invalidate any chat-related queries
      queryClient.invalidateQueries({
        queryKey: ["chat", variables.agentId],
      });

      // If graph data changed, invalidate graph queries
      if (_data.graphData) {
        queryClient.invalidateQueries({
          queryKey: ["graph"],
        });
      }
    },
  });
}

/**
 * Hook for getting chat history from localStorage with React Query caching
 */
export function useChatHistory(agentId: string | null) {
  const queryClient = useQueryClient();

  // Use a query for the history to enable caching
  const history = agentId ? getChatHistory(agentId) : [];

  const refreshHistory = () => {
    if (agentId) {
      queryClient.invalidateQueries({ queryKey: ["chat", agentId] });
    }
  };

  return {
    messages: history,
    refreshHistory,
    isEmpty: history.length === 0,
    messageCount: history.length,
  };
}
