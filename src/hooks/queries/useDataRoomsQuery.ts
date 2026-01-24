/**
 * useDataRoomsQuery Hook
 *
 * React Query hook for fetching data rooms with optional filtering.
 * Supports filtering by bonfire, wallet address, and pagination.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { DataRoomListResponse, DataRoomInfo } from "@/types";

interface UseDataRoomsQueryParams {
  /** Filter by bonfire ID */
  bonfireId?: string | null;
  /** Filter by creator wallet address */
  creatorWallet?: string | null;
  /** Filter by subscriber wallet address */
  subscriberWallet?: string | null;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Enable/disable the query */
  enabled?: boolean;
}

/**
 * Generate query key for data rooms
 */
export function dataRoomsQueryKey(params: UseDataRoomsQueryParams = {}) {
  return [
    "datarooms",
    {
      bonfireId: params.bonfireId ?? null,
      creatorWallet: params.creatorWallet ?? null,
      subscriberWallet: params.subscriberWallet ?? null,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  ] as const;
}

/**
 * Build query string from params
 */
function buildQueryString(params: UseDataRoomsQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.bonfireId) {
    searchParams.set("bonfire_id", params.bonfireId);
  }
  if (params.creatorWallet) {
    searchParams.set("creator_wallet", params.creatorWallet);
  }
  if (params.subscriberWallet) {
    searchParams.set("subscriber_wallet", params.subscriberWallet);
  }
  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }
  if (params.offset) {
    searchParams.set("offset", String(params.offset));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Fetch data rooms with optional filtering
 */
export function useDataRoomsQuery(params: UseDataRoomsQueryParams = {}) {
  const { enabled = true, ...filterParams } = params;

  return useQuery({
    queryKey: dataRoomsQueryKey(filterParams),
    queryFn: () => {
      const queryString = buildQueryString(filterParams);
      return apiClient.get<DataRoomListResponse>(`/api/datarooms${queryString}`);
    },
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Fetch a single data room by ID
 */
export function useDataRoomById(dataroomId: string | null) {
  return useQuery({
    queryKey: ["datarooms", dataroomId],
    queryFn: () => apiClient.get<DataRoomInfo>(`/api/datarooms/${dataroomId}`),
    enabled: !!dataroomId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch data rooms created by a specific wallet
 */
export function useMyCreatedDataRooms(walletAddress: string | null) {
  return useDataRoomsQuery({
    creatorWallet: walletAddress,
    enabled: !!walletAddress,
  });
}

/**
 * Fetch data rooms subscribed to by a specific wallet
 */
export function useMySubscribedDataRooms(walletAddress: string | null) {
  return useDataRoomsQuery({
    subscriberWallet: walletAddress,
    enabled: !!walletAddress,
  });
}
