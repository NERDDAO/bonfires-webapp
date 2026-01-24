/**
 * useBonfiresQuery Hook
 *
 * React Query hook for fetching the list of available bonfires.
 * Uses a longer staleTime since bonfire list changes infrequently.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { BonfireListResponse } from "@/types";

/**
 * Query key for bonfires
 */
export const bonfiresQueryKey = ["bonfires"] as const;

/**
 * Fetch all available bonfires
 */
export function useBonfiresQuery() {
  return useQuery({
    queryKey: bonfiresQueryKey,
    queryFn: () => apiClient.get<BonfireListResponse>("/api/bonfires"),
    staleTime: 10 * 60 * 1000, // 10 minutes - list changes infrequently
  });
}

/**
 * Get a specific bonfire by ID from the cached list
 */
export function useBonfireById(bonfireId: string | null) {
  const { data, ...rest } = useBonfiresQuery();

  const bonfire = bonfireId
    ? data?.bonfires.find((b) => b.id === bonfireId) ?? null
    : null;

  return {
    data: bonfire,
    ...rest,
  };
}
