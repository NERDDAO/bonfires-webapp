/**
 * useDataRoomsQuery Hook
 *
 * React Query hook for fetching data rooms with optional filtering.
 * Supports filtering by bonfire, wallet address, and pagination.
 */
"use client";

import type { DataRoomInfo, DataRoomListResponse } from "@/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

/**
 * useDataRoomsQuery Hook
 *
 * React Query hook for fetching data rooms with optional filtering.
 * Supports filtering by bonfire, wallet address, and pagination.
 */

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
      return apiClient.get<DataRoomListResponse>(
        `/api/datarooms${queryString}`
      );
    },
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

const DEFAULT_PAGE_SIZE = 12;

interface UseDataRoomsInfiniteQueryParams {
  /** Filter by bonfire ID */
  bonfireId?: string | null;
  /** Filter by creator wallet address */
  creatorWallet?: string | null;
  /** Filter by subscriber wallet address */
  subscriberWallet?: string | null;
  /** Page size (limit per request) */
  pageSize?: number;
  /** Enable/disable the query */
  enabled?: boolean;
}

/**
 * Infinite query for data rooms (load more via button).
 * Next page is requested when we received a full page (received >= limit); otherwise no next page.
 */
export function useDataRoomsInfiniteQuery(
  params: UseDataRoomsInfiniteQueryParams = {}
) {
  const {
    enabled = true,
    pageSize = DEFAULT_PAGE_SIZE,
    bonfireId,
    creatorWallet,
    subscriberWallet,
  } = params;

  return useInfiniteQuery({
    queryKey: [
      "datarooms",
      "infinite",
      {
        bonfireId: bonfireId ?? null,
        creatorWallet: creatorWallet ?? null,
        subscriberWallet: subscriberWallet ?? null,
        pageSize,
      },
    ],
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams();
      searchParams.set("limit", String(pageSize));
      searchParams.set("offset", String(pageParam));
      if (bonfireId) searchParams.set("bonfire_id", bonfireId);
      if (creatorWallet) searchParams.set("creator_wallet", creatorWallet);
      if (subscriberWallet)
        searchParams.set("subscriber_wallet", subscriberWallet);
      const queryString = searchParams.toString();
      return apiClient.get<DataRoomListResponse>(
        `/api/datarooms?${queryString}`
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const received = lastPage.datarooms.length;
      const requested = lastPage.limit;
      if (received < requested) return undefined;
      return lastPage.offset + received;
    },
    enabled,
    staleTime: 3 * 60 * 1000,
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
