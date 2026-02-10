/**
 * useHTNTemplatesQuery Hook
 *
 * React Query hook for fetching HTN templates with optional type filtering.
 */
"use client";

import type { HTNTemplateListResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

interface UseHTNTemplatesQueryParams {
  /** Filter by template type (blog, card, curriculum) */
  templateType?: string | null;
  /** Enable/disable the query */
  enabled?: boolean;
}

/**
 * Generate query key for HTN templates
 */
export function htnTemplatesQueryKey(
  params: UseHTNTemplatesQueryParams = {}
) {
  return [
    "htn-templates",
    { templateType: params.templateType ?? null },
  ] as const;
}

/**
 * Fetch active HTN templates with optional type filter
 */
export function useHTNTemplatesQuery(
  params: UseHTNTemplatesQueryParams = {}
) {
  const { enabled = true, templateType } = params;

  return useQuery({
    queryKey: htnTemplatesQueryKey({ templateType }),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (templateType) {
        searchParams.set("template_type", templateType);
      }
      const queryString = searchParams.toString();
      const url = `/api/htn-templates${queryString ? `?${queryString}` : ""}`;
      return apiClient.get<HTNTemplateListResponse>(url);
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - templates change infrequently
  });
}
