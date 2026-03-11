"use client";

import { useCallback, useReducer, useRef } from "react";

import { SSEParser } from "@/lib/sse-parser";
import type { BatchSSEEvent } from "@/types/applicant-reviews";

export interface CriterionState {
  reasoning: string;
  score: number | null;
  maxScore: number | null;
  summary: string | null;
}

export interface ApplicantStreamState {
  name: string;
  status: "evaluating" | "complete" | "error";
  criteria: Map<string, CriterionState>;
  overallScore: number | null;
  recommendation: string | null;
}

export interface BatchStreamState {
  status: "idle" | "connecting" | "streaming" | "complete" | "error";
  totalApplicants: number;
  completedApplicants: number;
  currentApplicantId: string | null;
  applicants: Map<string, ApplicantStreamState>;
  error: string | null;
  lastSeq: number;
  evaluatedCount: number;
  skippedCount: number;
  durationSeconds: number | null;
}

const initialState: BatchStreamState = {
  status: "idle",
  totalApplicants: 0,
  completedApplicants: 0,
  currentApplicantId: null,
  applicants: new Map(),
  error: null,
  lastSeq: 0,
  evaluatedCount: 0,
  skippedCount: 0,
  durationSeconds: null,
};

type Action =
  | { type: "CONNECTING" }
  | { type: "SSE_EVENT"; event: BatchSSEEvent }
  | { type: "ERROR"; message: string }
  | { type: "RESET" };

function reducer(state: BatchStreamState, action: Action): BatchStreamState {
  switch (action.type) {
    case "CONNECTING":
      return { ...initialState, status: "connecting", applicants: new Map() };

    case "RESET":
      return { ...initialState, applicants: new Map() };

    case "ERROR":
      return { ...state, status: "error", error: action.message };

    case "SSE_EVENT": {
      const event = action.event;
      const newState = { ...state, lastSeq: event.seq };

      switch (event.type) {
        case "batch:start":
          return {
            ...newState,
            status: "streaming",
            totalApplicants: event.total_applicants,
            applicants: new Map(),
          };

        case "applicant:start": {
          const applicants = new Map(state.applicants);
          applicants.set(event.applicant_id, {
            name: event.applicant_name,
            status: "evaluating",
            criteria: new Map(),
            overallScore: null,
            recommendation: null,
          });
          return {
            ...newState,
            status: "streaming",
            currentApplicantId: event.applicant_id,
            applicants,
          };
        }

        case "criterion:reasoning": {
          const applicants = new Map(state.applicants);
          const applicant = applicants.get(event.applicant_id);
          if (applicant) {
            const criteria = new Map(applicant.criteria);
            const existing = criteria.get(event.criterion_name);
            criteria.set(event.criterion_name, {
              reasoning: (existing?.reasoning ?? "") + event.chunk,
              score: existing?.score ?? null,
              maxScore: existing?.maxScore ?? null,
              summary: existing?.summary ?? null,
            });
            applicants.set(event.applicant_id, {
              ...applicant,
              criteria,
            });
          }
          return { ...newState, applicants };
        }

        case "criterion:score": {
          const applicants = new Map(state.applicants);
          const applicant = applicants.get(event.applicant_id);
          if (applicant) {
            const criteria = new Map(applicant.criteria);
            const existing = criteria.get(event.criterion_name);
            criteria.set(event.criterion_name, {
              reasoning: existing?.reasoning ?? "",
              score: event.score,
              maxScore: event.max_score,
              summary: event.reasoning_summary,
            });
            applicants.set(event.applicant_id, {
              ...applicant,
              criteria,
            });
          }
          return { ...newState, applicants };
        }

        case "applicant:complete": {
          const applicants = new Map(state.applicants);
          const applicant = applicants.get(event.applicant_id);
          if (applicant) {
            applicants.set(event.applicant_id, {
              ...applicant,
              status: "complete",
              overallScore: event.overall_score,
              recommendation: event.recommendation,
            });
          }
          return {
            ...newState,
            completedApplicants: state.completedApplicants + 1,
            applicants,
            currentApplicantId:
              state.currentApplicantId === event.applicant_id
                ? null
                : state.currentApplicantId,
          };
        }

        case "batch:complete":
          return {
            ...newState,
            status: "complete",
            completedApplicants: state.totalApplicants,
            currentApplicantId: null,
            evaluatedCount: event.evaluated_count,
            skippedCount: event.skipped_count,
            durationSeconds: event.duration_seconds,
          };

        case "error": {
          if (event.applicant_id) {
            const applicants = new Map(state.applicants);
            const applicant = applicants.get(event.applicant_id);
            if (applicant) {
              applicants.set(event.applicant_id, {
                ...applicant,
                status: "error",
              });
            }
            return {
              ...newState,
              applicants,
              error: event.recoverable ? null : event.message,
            };
          }
          return {
            ...newState,
            status: event.recoverable ? state.status : "error",
            error: event.message,
          };
        }

        case "heartbeat":
          return newState;

        default:
          return newState;
      }
    }

    default:
      return state;
  }
}

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 2000;

export function useBatchEvaluateStream() {
  const [streamState, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  const startStream = useCallback(
    async (applicationIds: string[], batchId?: string) => {
      // Cancel any existing stream
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;
      retryCountRef.current = 0;

      dispatch({ type: "CONNECTING" });

      const connect = async (resumeFromSeq?: number) => {
        try {
          const body: Record<string, unknown> = {
            application_ids: applicationIds,
          };
          if (batchId) body["batch_id"] = batchId;
          if (resumeFromSeq) body["resume_from_seq"] = resumeFromSeq;

          const response = await fetch(
            "/api/applicant-reviews/batch-evaluate-stream",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
              signal: controller.signal,
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              (errorData as { error?: string }).error ??
                `HTTP ${response.status}`
            );
          }

          if (!response.body) {
            throw new Error("No response body for SSE stream");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          const parser = new SSEParser();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const events = parser.parse(text);

            for (const event of events) {
              dispatch({ type: "SSE_EVENT", event });
            }
          }

          // Stream ended normally — if we didn't get batch:complete, it may have been interrupted
        } catch (error) {
          if (controller.signal.aborted) return;

          const message =
            error instanceof Error ? error.message : "Stream connection failed";

          // Retry with exponential backoff
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            const delay =
              RETRY_BASE_DELAY * Math.pow(2, retryCountRef.current - 1);
            console.warn(
              `[SSE] Retry ${retryCountRef.current}/${MAX_RETRIES} in ${delay}ms: ${message}`
            );
            await new Promise((r) => setTimeout(r, delay));
            if (!controller.signal.aborted) {
              await connect(streamState.lastSeq || undefined);
            }
          } else {
            dispatch({ type: "ERROR", message });
          }
        }
      };

      await connect();
    },
    // streamState.lastSeq is read via ref-like access in the retry path
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "RESET" });
  }, []);

  return { streamState, startStream, cancelStream };
}
