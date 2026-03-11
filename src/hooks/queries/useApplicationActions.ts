"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  useBatchEvaluateStream,
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
  const rescoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (rescoreTimeoutRef.current) {
        clearTimeout(rescoreTimeoutRef.current);
      }
    };
  }, []);

  const reevaluateAll = useCallback(
    async (applicationIds: string[], batchId?: string) => {
      if (applicationIds.length === 0) return;
      setReevaluateProgress({ completed: 0, total: applicationIds.length });
      const completed = await startStream(applicationIds, batchId);
      if (completed) {
        setReevaluateProgress({
          completed: applicationIds.length,
          total: applicationIds.length,
        });
      }
      // Don't clear reevaluateProgress here — let the consumer handle it
      // via onStreamComplete or by checking streamState.status
    },
    [startStream],
  );

  const clearProgress = useCallback(() => {
    setReevaluateProgress(null);
  }, []);

  const startSingleRescore = useCallback(() => {
    setReevaluateProgress({ completed: 0, total: 1 });
  }, []);

  const completeSingleRescore = useCallback(() => {
    setReevaluateProgress({ completed: 1, total: 1 });
    if (rescoreTimeoutRef.current) {
      clearTimeout(rescoreTimeoutRef.current);
    }
    rescoreTimeoutRef.current = setTimeout(() => {
      setReevaluateProgress(null);
      rescoreTimeoutRef.current = null;
    }, 1500);
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
