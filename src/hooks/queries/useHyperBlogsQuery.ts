/**
 * useHyperBlogsQuery Hook
 *
 * React Query hook for fetching hyperblogs with optional filtering.
 * Supports filtering by data room, author wallet, and pagination.
 */
"use client";

import type { HyperBlogInfo, HyperBlogListResponse } from "@/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

/**
 * useHyperBlogsQuery Hook
 *
 * React Query hook for fetching hyperblogs with optional filtering.
 * Supports filtering by data room, author wallet, and pagination.
 */

interface UseHyperBlogsQueryParams {
  /** Filter by data room ID */
  dataroomId?: string | null;
  /** Filter by bonfire ID (returns hyperblogs from all datarooms belonging to the bonfire) */
  bonfireId?: string | null;
  /** Filter by author wallet address */
  authorWallet?: string | null;
  /** Filter by public status */
  isPublic?: boolean;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Enable/disable the query */
  enabled?: boolean;
}

/**
 * Generate query key for hyperblogs
 */
export function hyperBlogsQueryKey(params: UseHyperBlogsQueryParams = {}) {
  return [
    "hyperblogs",
    {
      dataroomId: params.dataroomId ?? null,
      bonfireId: params.bonfireId ?? null,
      authorWallet: params.authorWallet ?? null,
      isPublic: params.isPublic ?? null,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  ] as const;
}

/**
 * Build query string from params
 */
function buildQueryString(params: UseHyperBlogsQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.dataroomId) {
    searchParams.set("dataroom_id", params.dataroomId);
  }
  if (params.bonfireId) {
    searchParams.set("bonfire_id", params.bonfireId);
  }
  if (params.authorWallet) {
    searchParams.set("author_wallet", params.authorWallet);
  }
  if (params.isPublic !== undefined) {
    searchParams.set("is_public", String(params.isPublic));
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
 * Fetch hyperblogs with optional filtering
 */
export function useHyperBlogsQuery(params: UseHyperBlogsQueryParams = {}) {
  const { enabled = true, ...filterParams } = params;

  return useQuery({
    queryKey: hyperBlogsQueryKey(filterParams),
    queryFn: () => {
      const queryString = buildQueryString(filterParams);
      return apiClient.get<HyperBlogListResponse>(
        `/api/hyperblogs${queryString}`
      );
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - content changes more frequently
  });
}

/**
 * Fetch a single hyperblog by ID
 */
export function useHyperBlogById(hyperblogId: string | null) {
  return useQuery({
    queryKey: ["hyperblogs", hyperblogId],
    queryFn: () =>
      apiClient.get<HyperBlogInfo>(`/api/hyperblogs/${hyperblogId}`),
    enabled: !!hyperblogId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch hyperblogs created by a specific wallet
 */
export function useMyHyperBlogs(walletAddress: string | null) {
  return useHyperBlogsQuery({
    authorWallet: walletAddress,
    enabled: !!walletAddress,
  });
}

/**
 * Fetch public hyperblogs feed
 */
export function usePublicHyperBlogsFeed(params?: {
  bonfireId?: string | null;
  limit?: number;
  offset?: number;
}) {
  return useHyperBlogsQuery({
    isPublic: true,
    bonfireId: params?.bonfireId,
    limit: params?.limit,
    offset: params?.offset,
  });
}

/**
 * Fetch hyperblogs for a specific data room
 */
export function useDataRoomHyperBlogs(dataroomId: string | null) {
  return useHyperBlogsQuery({
    dataroomId,
    enabled: !!dataroomId,
  });
}

const DEFAULT_HYPERBLOGS_PAGE_SIZE = 8;

interface UseDataRoomHyperBlogsInfiniteQueryParams {
  dataroomId: string | null;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Infinite query for hyperblogs in a specific data room.
 * Next page is requested when a full page was received.
 */
export function useDataRoomHyperBlogsInfiniteQuery({
  dataroomId,
  pageSize = DEFAULT_HYPERBLOGS_PAGE_SIZE,
  enabled = true,
}: UseDataRoomHyperBlogsInfiniteQueryParams) {
  return useInfiniteQuery({
    queryKey: ["hyperblogs", "infinite", "dataroom", dataroomId, pageSize],
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams();
      searchParams.set("limit", String(pageSize));
      searchParams.set("offset", String(pageParam));
      if (dataroomId) searchParams.set("dataroom_id", dataroomId);
      const queryString = searchParams.toString();
      return apiClient.get<HyperBlogListResponse>(
        `/api/hyperblogs?${queryString}`
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const received = lastPage.hyperblogs.length;
      const requested = lastPage.limit;
      if (received < requested) return undefined;
      return lastPage.offset + received;
    },
    enabled: !!dataroomId && enabled,
    staleTime: 2 * 60 * 1000,
  });
}
