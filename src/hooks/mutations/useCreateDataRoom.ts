/**
 * useCreateDataRoom Hook
 *
 * React Query mutation hook for creating new data rooms.
 * Invalidates data room queries on success.
 */
"use client";

import type { CreateDataRoomRequest, DataRoomInfo } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { dataRoomsQueryKey } from "@/hooks/queries";

import { apiClient } from "@/lib/api/client";

/**
 * useCreateDataRoom Hook
 *
 * React Query mutation hook for creating new data rooms.
 * Invalidates data room queries on success.
 */

interface CreateDataRoomParams extends CreateDataRoomRequest {
  /** Creator's wallet address */
  creator_wallet: string;
}

interface CreateDataRoomResult {
  dataroom: DataRoomInfo;
  success: boolean;
  message?: string;
}

/**
 * Hook for creating new data rooms
 */
export function useCreateDataRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: CreateDataRoomParams
    ): Promise<CreateDataRoomResult> => {
      const response = await apiClient.post<CreateDataRoomResult>(
        "/api/datarooms",
        params
      );

      if (!response.success) {
        throw new Error(response.message ?? "Failed to create data room");
      }

      return response;
    },
    onSuccess: (_data, variables) => {
      // Invalidate data rooms list queries
      queryClient.invalidateQueries({
        queryKey: ["datarooms"],
      });

      // Specifically invalidate queries filtered by bonfire
      queryClient.invalidateQueries({
        queryKey: dataRoomsQueryKey({ bonfireId: variables.bonfire_id }),
      });

      // Invalidate queries for creator's data rooms
      queryClient.invalidateQueries({
        queryKey: dataRoomsQueryKey({
          creatorWallet: variables.creator_wallet,
        }),
      });
    },
  });
}

/**
 * Hook for updating a data room
 */
export function useUpdateDataRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      dataroomId: string;
      updates: Partial<CreateDataRoomRequest>;
    }): Promise<DataRoomInfo> => {
      const response = await apiClient.put<{
        dataroom: DataRoomInfo;
        success: boolean;
      }>(`/api/datarooms/${params.dataroomId}`, params.updates);

      if (!response.success) {
        throw new Error("Failed to update data room");
      }

      return response.dataroom;
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific data room query
      queryClient.invalidateQueries({
        queryKey: ["datarooms", variables.dataroomId],
      });

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: ["datarooms"],
      });
    },
  });
}

/**
 * Hook for deleting a data room
 */
export function useDeleteDataRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dataroomId: string): Promise<void> => {
      await apiClient.delete(`/api/datarooms/${dataroomId}`);
    },
    onSuccess: (_data, dataroomId) => {
      // Remove specific data room from cache
      queryClient.removeQueries({
        queryKey: ["datarooms", dataroomId],
      });

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: ["datarooms"],
      });
    },
  });
}
