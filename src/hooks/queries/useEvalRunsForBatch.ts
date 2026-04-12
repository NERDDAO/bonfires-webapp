"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

export interface EvalRunSummary {
  run_id: string;
  status: string;
  graph_phase: string | null;
  review_bonfire_id: string | null;
  rubric_id: string | null;
  total_count: number;
  completed_count: number;
  failed_count: number;
  created_at: string;
}

export function useEvalRunsForBatch(batchId: string | null) {
  return useQuery({
    queryKey: ["evalRunsForBatch", batchId],
    queryFn: async (): Promise<EvalRunSummary[]> => {
      return apiClient.get<EvalRunSummary[]>(
        `/api/applicant-reviews/batch-eval-runs/by-batch/${batchId}`,
      );
    },
    enabled: !!batchId,
    staleTime: 30_000,
  });
}
