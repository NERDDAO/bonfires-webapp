/**
 * useNodeEpisodes Hook
 *
 * React Query hook for fetching episodes connected to a specific node.
 * Calls the /api/graph/node/{nodeUuid}/episodes endpoint.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { NodeEpisodesResponse } from "@/types";

/**
 * Generate query key for node episodes queries
 */
export function nodeEpisodesQueryKey(
  nodeUuid: string,
  bonfireId: string,
  limit: number
) {
  return ["node-episodes", nodeUuid, bonfireId, limit] as const;
}

/**
 * Hook to fetch episodes connected to a specific node
 *
 * @param nodeUuid - UUID of the node to get episodes for
 * @param bonfireId - Bonfire ID for scoping
 * @param limit - Maximum episodes to return (default: 50)
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useNodeEpisodes(
 *   selectedNode.uuid,
 *   currentBonfireId,
 *   50
 * );
 *
 * if (data?.episodes) {
 *   // Display episodes list
 * }
 * ```
 */
export function useNodeEpisodes(
  nodeUuid: string,
  bonfireId: string,
  limit = 50,
  enabled = true
) {
  return useQuery({
    queryKey: nodeEpisodesQueryKey(nodeUuid, bonfireId, limit),
    queryFn: async (): Promise<NodeEpisodesResponse> => {
      const response = await apiClient.get<NodeEpisodesResponse>(
        `/api/graph/node/${nodeUuid}/episodes`,
        {
          params: {
            bonfire_id: bonfireId,
            limit: String(limit),
          },
        }
      );

      if (!response.success) {
        throw new Error(response.message ?? "Failed to fetch node episodes");
      }

      return response;
    },
    enabled: enabled && !!nodeUuid && !!bonfireId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export default useNodeEpisodes;
