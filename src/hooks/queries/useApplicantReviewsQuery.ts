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
  /** Override refetch interval (ms). When active (e.g. batch modal open), use 4000; default 15000. */
  refetchInterval?: number;
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
    refetchInterval = 15000,
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
    refetchInterval,
  });
}

interface UseApplicantReviewDetailParams {
  applicationId: string | null;
  refetchInterval?: number;
}

export function useApplicantReviewDetail(
  applicationIdOrParams: string | null | UseApplicantReviewDetailParams,
) {
  const params: UseApplicantReviewDetailParams =
    typeof applicationIdOrParams === "object" && applicationIdOrParams !== null
      ? applicationIdOrParams
      : { applicationId: applicationIdOrParams };
  const applicationId = params.applicationId;
  const refetchInterval = params.refetchInterval ?? 15000;

  return useQuery({
    queryKey: ["applicantReviewDetail", applicationId],
    queryFn: () =>
      apiClient.get<ApplicantReviewDetailResponse>(
        `/api/applicant-reviews/${applicationId}`,
        { cache: false },
      ),
    enabled: !!applicationId,
    refetchInterval,
  });
}
