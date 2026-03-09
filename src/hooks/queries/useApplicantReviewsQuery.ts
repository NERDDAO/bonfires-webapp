"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type {
  ApplicantReviewDetailResponse,
  ApplicantReviewListResponse,
} from "@/types/applicant-reviews";

interface UseApplicantReviewsParams {
  bonfireId: string | null;
  batchId?: string | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  shortlistOnly?: boolean;
  enabled?: boolean;
}

export function applicantReviewsQueryKey(params: UseApplicantReviewsParams) {
  return [
    "applicantReviews",
    {
      bonfireId: params.bonfireId,
      batchId: params.batchId ?? null,
      sortBy: params.sortBy ?? "score",
      sortOrder: params.sortOrder ?? "desc",
      shortlistOnly: params.shortlistOnly ?? false,
    },
  ] as const;
}

export function useApplicantReviewsQuery(params: UseApplicantReviewsParams) {
  const {
    bonfireId,
    batchId,
    sortBy = "score",
    sortOrder = "desc",
    shortlistOnly = false,
    enabled = true,
  } = params;

  return useQuery({
    queryKey: applicantReviewsQueryKey(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        bonfire_id: bonfireId ?? "",
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (batchId) {
        searchParams.set("batch_id", batchId);
      }
      if (shortlistOnly) {
        searchParams.set("shortlist_only", "true");
      }
      return apiClient.get<ApplicantReviewListResponse>(
        `/api/applicant-reviews?${searchParams.toString()}`,
        { cache: false },
      );
    },
    enabled: enabled && !!bonfireId,
    refetchInterval: 15000,
  });
}

export function useApplicantReviewDetail(applicationId: string | null) {
  return useQuery({
    queryKey: ["applicantReviewDetail", applicationId],
    queryFn: () =>
      apiClient.get<ApplicantReviewDetailResponse>(
        `/api/applicant-reviews/${applicationId}`,
        { cache: false },
      ),
    enabled: !!applicationId,
    refetchInterval: 15000,
  });
}
