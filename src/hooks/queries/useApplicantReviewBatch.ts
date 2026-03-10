"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import type { ApplicantReviewBatchInfo } from "@/types/applicant-reviews";

const BATCH_POLL_INTERVAL_MS = 4000;

export function useApplicantReviewBatch(batchId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["applicantReviewBatch", batchId],
    queryFn: () =>
      apiClient.get<ApplicantReviewBatchInfo>(
        `/api/applicant-review-batches/${batchId}`,
        { cache: false },
      ),
    enabled: enabled && !!batchId,
    refetchInterval: enabled && batchId ? BATCH_POLL_INTERVAL_MS : false,
  });
}
