"use client";

import { useCallback, useState } from "react";

import { apiClient } from "@/lib/api/client";

export interface ReevaluateProgress {
  completed: number;
  total: number;
}

export function useApplicationActions() {
  const [reevaluateProgress, setReevaluateProgress] = useState<ReevaluateProgress | null>(
    null,
  );

  const reevaluateAll = useCallback(
    async (applicationIds: string[], batchId?: string) => {
      if (applicationIds.length === 0) return;
      setReevaluateProgress({ completed: 0, total: applicationIds.length });
      try {
        const body: { application_ids: string[]; batch_id?: string } = {
          application_ids: applicationIds,
        };
        if (batchId) {
          body.batch_id = batchId;
        }
        await apiClient.post<{
          success: boolean;
          evaluated_count: number;
          skipped_count: number;
          process_stack_task_id?: string | null;
        }>("/api/applicant-reviews/batch-evaluate", body);
        setReevaluateProgress({
          completed: applicationIds.length,
          total: applicationIds.length,
        });
      } finally {
        setReevaluateProgress(null);
      }
    },
    [],
  );

  const isReevaluating = reevaluateProgress != null;

  return {
    reevaluateProgress,
    reevaluateAll,
    isReevaluating,
  };
}
