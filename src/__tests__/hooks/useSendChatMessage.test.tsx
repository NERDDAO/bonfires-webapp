/**
 * useSendChatMessage Hook Tests
 *
 * Tests for the chat message mutation hook including localStorage integration.
 */
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useSendChatMessage } from "@/hooks/mutations";

import { apiClient } from "@/lib/api/client";
import { addChatMessage, getChatHistory } from "@/lib/storage/chatHistory";

// Mock the API client
jest.mock("@/lib/api/client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock chat history storage
jest.mock("@/lib/storage/chatHistory", () => ({
  getChatHistory: jest.fn(() => []),
  addChatMessage: jest.fn(),
}));

// Mock uuid
jest.mock("uuid", () => ({
  v4: () => "mock-uuid-1234",
}));

describe("useSendChatMessage", () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
    (getChatHistory as jest.Mock).mockReturnValue([]);
  });

  it("should send a chat message and store in localStorage", async () => {
    const mockResponse = {
      reply: "Hello! How can I help you?",
      graph_action: "static",
    };

    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useSendChatMessage(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        agentId: "agent-123",
        message: "Hello!",
        bonfireId: "bonfire-456",
      });
    });

    // Check API was called correctly
    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/agents/agent-123/chat",
      expect.objectContaining({
        message: "Hello!",
        agent_id: "agent-123",
        bonfire_id: "bonfire-456",
        graph_mode: "adaptive",
      })
    );

    // Check localStorage was updated
    expect(addChatMessage).toHaveBeenCalledTimes(2); // User message + assistant response

    // First call - user message
    expect(addChatMessage).toHaveBeenNthCalledWith(
      1,
      "agent-123",
      expect.objectContaining({
        role: "user",
        content: "Hello!",
      })
    );

    // Second call - assistant response
    expect(addChatMessage).toHaveBeenNthCalledWith(
      2,
      "agent-123",
      expect.objectContaining({
        role: "assistant",
        content: "Hello! How can I help you?",
      })
    );
  });

  it("should include chat history in the request", async () => {
    const existingHistory = [
      {
        id: "1",
        role: "user" as const,
        content: "Previous message",
        timestamp: "2024-01-01T00:00:00Z",
      },
      {
        id: "2",
        role: "assistant" as const,
        content: "Previous response",
        timestamp: "2024-01-01T00:00:01Z",
      },
    ];

    (getChatHistory as jest.Mock).mockReturnValue(existingHistory);

    const mockResponse = {
      reply: "Response to new message",
    };

    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useSendChatMessage(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        agentId: "agent-123",
        message: "New message",
      });
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/agents/agent-123/chat",
      expect.objectContaining({
        chat_history: [
          { role: "user", content: "Previous message" },
          { role: "assistant", content: "Previous response" },
        ],
      })
    );
  });

  it("should skip chat history when includeHistory is false", async () => {
    const existingHistory = [
      {
        id: "1",
        role: "user" as const,
        content: "Previous message",
        timestamp: "2024-01-01T00:00:00Z",
      },
    ];

    (getChatHistory as jest.Mock).mockReturnValue(existingHistory);

    const mockResponse = { reply: "Response" };
    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useSendChatMessage(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        agentId: "agent-123",
        message: "New message",
        includeHistory: false,
      });
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/agents/agent-123/chat",
      expect.objectContaining({
        chat_history: [],
      })
    );
  });

  it("should include graph context when provided", async () => {
    const graphState = {
      nodes: [
        { data: { id: "n:node-1", label: "Node 1", node_type: "entity" } },
      ],
      edges: [
        {
          data: { source: "n:node-1", target: "n:node-2", label: "related_to" },
        },
      ],
      nodeCount: 1,
      edgeCount: 1,
      centerNodeUuid: "node-1",
      lastUpdated: "2025-01-01T00:00:00Z",
    };

    const mockResponse = { reply: "Graph context received" };
    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useSendChatMessage(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        agentId: "agent-123",
        message: "Explain the graph",
        context: { graphState },
      });
    });

    const requestBody = (apiClient.post as jest.Mock).mock.calls[0]?.[1];
    expect(requestBody.context).toEqual({ graphState });
    expect(requestBody.graph_id).toBeUndefined();
  });

  it("should handle API errors", async () => {
    const error = new Error("Network error");
    (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useSendChatMessage(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          agentId: "agent-123",
          message: "Hello!",
        });
      })
    ).rejects.toThrow("Network error");

    // User message should still be stored (saved before API call)
    expect(addChatMessage).toHaveBeenCalledTimes(1);
  });

  it("should return graph data when provided", async () => {
    const mockResponse = {
      reply: "Here is the graph",
      graph_action: "regenerate",
      graph_data: { nodes: [], edges: [] },
      new_graph_id: "new-graph-123",
    };

    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useSendChatMessage(), { wrapper });

    let response:
      | Awaited<ReturnType<typeof result.current.mutateAsync>>
      | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({
        agentId: "agent-123",
        message: "Show me the graph",
      });
    });

    expect(response?.graphAction).toBe("regenerate");
    expect(response?.graphData).toEqual({ nodes: [], edges: [] });
    expect(response?.newGraphId).toBe("new-graph-123");
  });
});
