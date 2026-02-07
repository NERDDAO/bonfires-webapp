/**
 * useGraphQuery Hook
 *
 * React Query hook for graph queries with async polling support.
 * Long-running graph operations use the job system to avoid serverless timeouts.
 */
"use client";

import { useCallback, useState } from "react";

import type {
  DelveRequest,
  DelveResponse,
  JobInitiateResponse,
  VectorSearchResponse,
} from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

import type { GraphData, GraphQueryParams } from "@/types/graph";

/**
 * useGraphQuery Hook
 *
 * React Query hook for graph queries with async polling support.
 * Long-running graph operations use the job system to avoid serverless timeouts.
 */

interface UseGraphQueryParams extends GraphQueryParams {
  enabled?: boolean;
  /** Use async polling for long-running queries */
  useAsyncPolling?: boolean;
  /** Callback for progress updates during polling */
  onProgress?: (progress: number) => void;
}

interface GraphQueryResponse {
  success: boolean;
  data?: GraphData;
  job_id?: string;
  error?: string;
}

type GraphQueryApiResponse =
  | GraphQueryResponse
  | GraphData
  | DelveResponse
  | JobInitiateResponse;

function isJobResponse(
  response: GraphQueryApiResponse
): response is JobInitiateResponse | GraphQueryResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    ("jobId" in response || "job_id" in response)
  );
}

function extractGraphData(
  response: GraphQueryApiResponse,
  metadata: GraphData["metadata"]
): GraphData | null {
  if (typeof response !== "object" || response === null) {
    return null;
  }

  if ("success" in response && response.success && "data" in response) {
    return response.data ?? null;
  }

  if ("nodes" in response && "edges" in response) {
    const nodes = [
      ...(response.nodes as GraphData["nodes"]),
      ...((response as { entities?: GraphData["nodes"] }).entities ?? []),
    ];
    return {
      nodes,
      edges: response.edges as GraphData["edges"],
      metadata,
    };
  }

  return null;
}

/**
 * Generate query key for graph queries
 */
export function graphQueryKey(params: GraphQueryParams) {
  return [
    "graph",
    {
      bonfire_id: params.bonfire_id,
      agent_id: params.agent_id,
      center_uuid: params.center_uuid,
      search_query: params.search_query,
    },
  ] as const;
}

/**
 * Fetch graph data with optional async polling for long-running queries
 */
export function useGraphQuery({
  enabled = true,
  useAsyncPolling = true,
  onProgress,
  ...params
}: UseGraphQueryParams) {
  const [progress, setProgress] = useState<number>(0);
  const trimmedQuery = params.search_query?.trim() ?? "";

  const handleProgress = useCallback(
    (p: number) => {
      setProgress(p);
      onProgress?.(p);
    },
    [onProgress]
  );

  return useQuery({
    queryKey: graphQueryKey(params),
    queryFn: async (): Promise<GraphData> => {
      if (!trimmedQuery) {
        throw new Error("Query is required for graph search");
      }

      const requestBody: DelveRequest = {
        bonfire_id: params.bonfire_id,
        query: trimmedQuery,
        num_results: params.limit ?? 10,
        center_node_uuid: params.center_uuid,
      };

      const response = await apiClient.post<GraphQueryApiResponse>(
        "/api/graph/query",
        requestBody
      );

      if (useAsyncPolling && isJobResponse(response)) {
        const jobId = "jobId" in response ? response.jobId : response.job_id;
        if (!jobId) {
          throw new Error("Graph query did not return a job ID");
        }

        return apiClient.pollJobStatus<GraphData>(jobId, {
          interval: 1000,
          timeout: 5 * 60 * 1000, // 5 minutes
          onProgress: handleProgress,
        });
      }

      const graphData = extractGraphData(response, {
        bonfire_id: params.bonfire_id,
        agent_id: params.agent_id,
        query: trimmedQuery,
        timestamp: new Date().toISOString(),
      });
      if (!graphData) {
        if (
          typeof response === "object" &&
          response !== null &&
          "error" in response
        ) {
          const errorMessage =
            typeof response.error === "string"
              ? response.error
              : "Graph query failed";
          throw new Error(errorMessage);
        }
        throw new Error("Graph query failed");
      }

      return graphData;
    },
    enabled: enabled && !!params.bonfire_id && trimmedQuery.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      progress,
    },
  });
}

/**
 * Hook to expand a node in the graph
 */
export function useGraphExpand() {
  const queryClient = useQueryClient();

  const expand = useCallback(
    async (params: {
      bonfire_id: string;
      node_uuid: string;
      depth?: number;
      limit?: number;
    }): Promise<GraphData> => {
      const response = await apiClient.post<GraphQueryResponse>(
        "/api/graph/expand",
        params
      );

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Graph expansion failed");
      }

      // Invalidate related graph queries to pick up new data
      queryClient.invalidateQueries({
        queryKey: ["graph", { bonfire_id: params.bonfire_id }],
      });

      return response.data;
    },
    [queryClient]
  );

  return { expand };
}

/**
 * Hook for graph search queries
 */
export function useGraphSearch(params: {
  bonfire_id: string;
  query: string;
  limit?: number;
  enabled?: boolean;
}) {
  const { enabled = true, ...searchParams } = params;

  return useQuery({
    queryKey: ["graph", "search", searchParams],
    queryFn: async (): Promise<VectorSearchResponse> => {
      const response = await apiClient.post<VectorSearchResponse>(
        "/api/graph/search",
        searchParams
      );
      return response;
    },
    enabled: enabled && !!searchParams.bonfire_id && !!searchParams.query,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}
