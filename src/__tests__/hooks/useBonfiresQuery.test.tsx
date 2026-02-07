/**
 * useBonfiresQuery Hook Tests
 *
 * Tests for the bonfires query hook.
 */
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";

import { useBonfireById, useBonfiresQuery } from "@/hooks/queries";

import { apiClient } from "@/lib/api/client";

// Mock the API client
jest.mock("@/lib/api/client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe("useBonfiresQuery", () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  it("should fetch bonfires", async () => {
    const mockBonfires = {
      bonfires: [
        {
          id: "1",
          name: "Bonfire 1",
          description: "Test",
          created_at: "2024-01-01",
          agent_count: 2,
        },
        {
          id: "2",
          name: "Bonfire 2",
          description: "Test",
          created_at: "2024-01-02",
          agent_count: 3,
        },
      ],
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce(mockBonfires);

    const { result } = renderHook(() => useBonfiresQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockBonfires);
    expect(apiClient.get).toHaveBeenCalledWith("/api/bonfires");
  });

  it("should handle fetch errors", async () => {
    const error = new Error("Network error");
    (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useBonfiresQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe("useBonfireById", () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  it("should return a specific bonfire from the list", async () => {
    const mockBonfires = {
      bonfires: [
        {
          id: "1",
          name: "Bonfire 1",
          description: "Test",
          created_at: "2024-01-01",
          agent_count: 2,
        },
        {
          id: "2",
          name: "Bonfire 2",
          description: "Test",
          created_at: "2024-01-02",
          agent_count: 3,
        },
      ],
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce(mockBonfires);

    const { result } = renderHook(() => useBonfireById("2"), { wrapper });

    await waitFor(() => {
      expect(result.current.data).not.toBeNull();
    });

    expect(result.current.data).toEqual(mockBonfires.bonfires[1]);
  });

  it("should return null for non-existent bonfire", async () => {
    const mockBonfires = {
      bonfires: [
        {
          id: "1",
          name: "Bonfire 1",
          description: "Test",
          created_at: "2024-01-01",
          agent_count: 2,
        },
      ],
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce(mockBonfires);

    const { result } = renderHook(() => useBonfireById("999"), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it("should return null when bonfireId is null", async () => {
    const { result } = renderHook(() => useBonfireById(null), { wrapper });

    // Should not make any API calls
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });
});
