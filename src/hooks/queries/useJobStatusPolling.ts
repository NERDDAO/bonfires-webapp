/**
 * useJobStatusPolling Hook
 *
 * Generic hook for polling async job status.
 * Used for long-running operations like graph queries and hyperblog generation.
 */
"use client";

import { useCallback, useEffect, useState } from "react";

import type { JobResponse, JobStatus } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

/**
 * useJobStatusPolling Hook
 *
 * Generic hook for polling async job status.
 * Used for long-running operations like graph queries and hyperblog generation.
 */

interface UseJobStatusPollingParams {
  /** The job ID to poll */
  jobId: string | null;
  /** Polling interval in milliseconds */
  interval?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Callback when progress updates */
  onProgress?: (progress: number) => void;
  /** Callback when job completes */
  onComplete?: (result: unknown) => void;
  /** Callback when job fails */
  onError?: (error: string) => void;
  /** Enable/disable polling */
  enabled?: boolean;
}

interface JobPollingState {
  status: JobStatus | null;
  progress: number;
  result: unknown;
  error: string | null;
  isPolling: boolean;
  elapsedTime: number;
}

/**
 * Generate query key for job status
 */
export function jobStatusQueryKey(jobId: string | null) {
  return ["job", jobId] as const;
}

/**
 * Poll for job status with callbacks
 */
export function useJobStatusPolling({
  jobId,
  interval = 1000,
  timeout = 5 * 60 * 1000,
  onProgress,
  onComplete,
  onError,
  enabled = true,
}: UseJobStatusPollingParams) {
  const [state, setState] = useState<JobPollingState>({
    status: null,
    progress: 0,
    result: null,
    error: null,
    isPolling: false,
    elapsedTime: 0,
  });

  const [startTime, setStartTime] = useState<number | null>(null);

  const query = useQuery({
    queryKey: jobStatusQueryKey(jobId),
    queryFn: () =>
      apiClient.get<JobResponse>(`/api/jobs/${jobId}`, { cache: false }),
    enabled:
      enabled &&
      !!jobId &&
      state.status !== "complete" &&
      state.status !== "failed",
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling if job is complete or failed
      if (data?.status === "complete" || data?.status === "failed") {
        return false;
      }
      return interval;
    },
    staleTime: 0, // Always fetch fresh status
  });

  // Update state when job data changes
  useEffect(() => {
    if (!query.data) return;

    const job = query.data;
    const newProgress = job.progress ?? 0;

    setState((prev) => ({
      ...prev,
      status: job.status,
      progress: newProgress,
      result: job.result,
      error: job.error ?? null,
      isPolling: job.status === "pending" || job.status === "processing",
      elapsedTime: startTime ? Date.now() - startTime : 0,
    }));

    // Trigger callbacks
    if (newProgress !== state.progress) {
      onProgress?.(newProgress);
    }

    if (job.status === "complete" && job.result) {
      onComplete?.(job.result);
    }

    if (job.status === "failed" && job.error) {
      onError?.(job.error);
    }
  }, [query.data, onProgress, onComplete, onError, startTime, state.progress]);

  // Track start time
  useEffect(() => {
    if (jobId && enabled && !startTime) {
      setStartTime(Date.now());
    }
    if (!jobId || !enabled) {
      setStartTime(null);
      setState({
        status: null,
        progress: 0,
        result: null,
        error: null,
        isPolling: false,
        elapsedTime: 0,
      });
    }
  }, [jobId, enabled, startTime]);

  // Check for timeout
  useEffect(() => {
    if (!startTime || !state.isPolling) return;

    const checkTimeout = () => {
      if (Date.now() - startTime > timeout) {
        onError?.("Job polling timeout exceeded");
        setState((prev) => ({
          ...prev,
          error: "Timeout exceeded",
          isPolling: false,
        }));
      }
    };

    const timeoutId = setInterval(checkTimeout, 1000);
    return () => clearInterval(timeoutId);
  }, [startTime, state.isPolling, timeout, onError]);

  return {
    ...state,
    refetch: query.refetch,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}

/**
 * Hook to start and track a job
 */
export function useStartJob() {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);

  const startJob = useCallback(
    async (endpoint: string, data: unknown): Promise<string> => {
      const response = await apiClient.initiateJob(endpoint, data);
      setJobId(response.jobId);
      return response.jobId;
    },
    []
  );

  const resetJob = useCallback(() => {
    if (jobId) {
      queryClient.invalidateQueries({ queryKey: jobStatusQueryKey(jobId) });
    }
    setJobId(null);
  }, [jobId, queryClient]);

  return {
    jobId,
    startJob,
    resetJob,
  };
}

/**
 * Combined hook for starting a job and polling its status
 */
export function useJobWithPolling(
  options?: Omit<UseJobStatusPollingParams, "jobId">
) {
  const { jobId, startJob, resetJob } = useStartJob();

  const polling = useJobStatusPolling({
    jobId,
    ...options,
  });

  return {
    jobId,
    startJob,
    resetJob,
    ...polling,
  };
}
