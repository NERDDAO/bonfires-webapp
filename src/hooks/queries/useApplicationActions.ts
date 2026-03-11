"use client";

import { useCallback, useState } from "react";

import {
  useBatchEvaluateStream,
  type BatchStreamState,
} from "./useBatchEvaluateStream";

export interface ReevaluateProgress {
  completed: number;
  total: number;
}

export function useApplicationActions() {
  const [reevaluateProgress, setReevaluateProgress] =
    useState<ReevaluateProgress | null>(null);
  const { streamState, startStream, cancelStream } =
    useBatchEvaluateStream();

  const reevaluateAll = useCallback(
    async (applicationIds: string[], batchId?: string) => {
      if (applicationIds.length === 0) return;
      setReevaluateProgress({ completed: 0, total: applicationIds.length });
      try {
        await startStream(applicationIds, batchId);
      } finally {
        // Keep progress visible briefly after completion
        if (streamState.status === "complete") {
          setReevaluateProgress({
            completed: applicationIds.length,
            total: applicationIds.length,
          });
        }
        // Don't clear reevaluateProgress here — let the consumer handle it
        // via onStreamComplete or by checking streamState.status
      }
    },
    [startStream, streamState.status],
  );

  const clearProgress = useCallback(() => {
    setReevaluateProgress(null);
  }, []);

  const startSingleRescore = useCallback(() => {
    setReevaluateProgress({ completed: 0, total: 1 });
  }, []);

  const completeSingleRescore = useCallback(() => {
    setReevaluateProgress({ completed: 1, total: 1 });
    const t = setTimeout(() => setReevaluateProgress(null), 1500);
    return () => clearTimeout(t);
  }, []);

  // Derive progress from stream state when streaming
  const derivedProgress: ReevaluateProgress | null =
    streamState.status === "streaming" || streamState.status === "connecting"
      ? {
          completed: streamState.completedApplicants,
          total: streamState.totalApplicants || reevaluateProgress?.total || 0,
        }
      : streamState.status === "complete"
        ? {
            completed: streamState.totalApplicants,
            total: streamState.totalApplicants,
          }
        : reevaluateProgress;

  const isReevaluating =
    derivedProgress != null ||
    streamState.status === "streaming" ||
    streamState.status === "connecting";

  return {
    reevaluateProgress: derivedProgress,
    reevaluateAll,
    startSingleRescore,
    completeSingleRescore,
    clearProgress,
    isReevaluating,
    streamState,
    cancelStream,
  };
}
