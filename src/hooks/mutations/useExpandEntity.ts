/**
 * useExpandEntity Hook
 *
 * React Query mutation hook for expanding entity nodes in the graph.
 * Calls the /api/graph/expand/entity endpoint to retrieve connected
 * edges and nodes for a specific entity.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { GraphExpandResponse } from "@/types";

export interface ExpandEntityParams {
  /** UUID of the entity to expand */
  entityUuid: string;
  /** Bonfire ID for scoping */
  bonfireId: string;
  /** Maximum edges to return (default: 50) */
  limit?: number;
}

/**
 * Hook to expand an entity node in the graph
 *
 * @example
 * ```tsx
 * const { mutateAsync: expandEntity, isPending } = useExpandEntity();
 *
 * const handleExpand = async (nodeData) => {
 *   const result = await expandEntity({
 *     entityUuid: nodeData.uuid,
 *     bonfireId: currentBonfireId,
 *     limit: 50,
 *   });
 *   // Handle result.nodes and result.edges
 * };
 * ```
 */
export function useExpandEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityUuid,
      bonfireId,
      limit = 50,
    }: ExpandEntityParams): Promise<GraphExpandResponse> => {
      const response = await apiClient.post<GraphExpandResponse>(
        "/api/graph/expand/entity",
        {
          entity_uuid: entityUuid,
          bonfire_id: bonfireId,
          limit,
        }
      );

      if (!response.success) {
        throw new Error(response.message ?? "Failed to expand entity");
      }

      return response;
    },
    onSuccess: (_data, variables) => {
      // Invalidate related graph queries to pick up new data
      queryClient.invalidateQueries({
        queryKey: ["graph", { bonfire_id: variables.bonfireId }],
      });
    },
  });
}

export default useExpandEntity;
