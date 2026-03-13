"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { RubricListResponse, StructuredRubricResponse } from "@/types/applicant-reviews";

export function useRubricListQuery(bonfireId: string | null) {
  return useQuery({
    queryKey: ["rubricList", bonfireId],
    queryFn: () =>
      apiClient.get<RubricListResponse>(
        `/api/applicant-review-rubrics?bonfire_id=${bonfireId}`,
      ),
    enabled: !!bonfireId,
    staleTime: 60_000,
  });
}

export function useStructuredRubricQuery(
  rubricDocumentId: string | null,
  bonfireId: string | null,
) {
  return useQuery({
    queryKey: ["structuredRubric", rubricDocumentId],
    queryFn: () =>
      apiClient.get<StructuredRubricResponse>(
        `/api/applicant-review-rubrics/${rubricDocumentId}?bonfire_id=${bonfireId}`,
      ),
    enabled: !!rubricDocumentId && !!bonfireId,
    staleTime: 60_000,
  });
}
