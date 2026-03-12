"use client";

import { useCallback, useState } from "react";

import { useApplicantReviewBatch } from "./useApplicantReviewBatch";

export function useBatchProgress() {
  const [isOpen, setIsOpen] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);

  const { data: batch } = useApplicantReviewBatch(batchId, isOpen);

  const open = useCallback((id: string) => {
    setBatchId(id);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setBatchId(null);
  }, []);

  const isProcessing =
    batch != null && batch.status !== "completed" && batch.status !== "failed";

  return {
    isOpen,
    open,
    close,
    batch: batch ?? undefined,
    isProcessing: isProcessing ?? false,
  };
}
