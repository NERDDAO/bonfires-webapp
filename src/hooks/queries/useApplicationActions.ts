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
  const { streamState, startStream, cancelStream, dispatchGraphExpand } =
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
    async (opts: {
      batchId: string;
      totalCount: number;
      rubricId?: string | null;
      force?: boolean;
      rescoreOnly?: boolean;
      reviewBonfireId?: string;
    }) => {
      if (!opts.batchId) return;
      setReevaluateProgress({ completed: 0, total: opts.totalCount });
      try {
        await startStream({
          batchId: opts.batchId,
          rubricId: opts.rubricId,
          force: opts.force,
          rescoreOnly: opts.rescoreOnly,
          reviewBonfireId: opts.reviewBonfireId,
        });
      } finally {
        if (streamState.status === "complete") {
          setReevaluateProgress({
            completed: opts.totalCount,
            total: opts.totalCount,
          });
        }
      }
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
    streamState.status === "streaming" ||
    streamState.status === "connecting" ||
    (reevaluateProgress != null && streamState.status !== "complete");

  return {
    reevaluateProgress: derivedProgress,
    reevaluateAll,
    startSingleRescore,
    completeSingleRescore,
    clearProgress,
    isReevaluating,
    streamState,
    cancelStream,
    dispatchGraphExpand,
  };
}
