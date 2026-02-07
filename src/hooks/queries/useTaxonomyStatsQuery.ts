/**
 * useTaxonomyStatsQuery Hook
 *
 * React Query hook for fetching taxonomy stats for a bonfire.
 */
"use client";

import type { TaxonomyStatsResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

/**
 * useTaxonomyStatsQuery Hook
 *
 * React Query hook for fetching taxonomy stats for a bonfire.
 */

export function taxonomyStatsQueryKey(bonfireId: string | null) {
  return ["taxonomyStats", bonfireId] as const;
}

export function useTaxonomyStatsQuery(bonfireId: string | null) {
  return useQuery({
    queryKey: taxonomyStatsQueryKey(bonfireId),
    queryFn: () =>
      apiClient.get<TaxonomyStatsResponse>(
        `/api/bonfires/${bonfireId}/taxonomy-stats`
      ),
    enabled: !!bonfireId,
    staleTime: 5 * 60 * 1000,
  });
}
