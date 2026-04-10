"use client";

import { useEffect, useRef, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { ReviewGraphPanel } from "@/components/applicant-reviews/ReviewGraphPanel";
import type {
  ApplicantStreamState,
  BatchStreamState,
} from "@/hooks/queries/useBatchEvaluateStream";
import type { ApplicantReviewBatchInfo, ApplicationStatusItem } from "@/types/applicant-reviews";

const PHASE_LABELS: Record<string, string> = {
  init_run: "Initializing...",
  fork_review_bonfire: "Setting up review environment...",
  generate_ontology: "Building ontology...",
  chunk_applicants: "Preparing applicants...",
  dispatch_research: "Researching applicants...",
  ingest_to_kg: "Ingesting to knowledge graph...",
  build_trimtab: "Building heuristic index...",
  dispatch_scorers: "Scoring applicants...",
  aggregate_scores: "Aggregating scores...",
  persist_reviews: "Saving reviews...",
  finalize_run: "Finalizing...",
};

interface ReevaluateProgress {
  completed: number;
  total: number;
}

interface BatchProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: ApplicantReviewBatchInfo | undefined;
  reevaluateProgress?: ReevaluateProgress | null;
  onReevaluateAll?: () => void;
  streamState?: BatchStreamState;
  onCancel?: () => void;
  onRetryApplication?: (applicationId: string) => void;
  reviewBonfireId?: string;
}

function ProgressBar({
  value,
  total,
  className,
}: {
  value: number;
  total: number;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="mt-1 h-1.5 w-full rounded bg-dark-s-700 overflow-hidden">
      <div
        className={className ?? "h-full rounded bg-primary"}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatusIcon({ phase }: { phase: string }) {
  if (phase === "completed") return <span style={{ color: "#22c55e" }}>●</span>;
  if (phase === "running") return <span style={{ color: "#f59e0b" }}>◌</span>;
  if (phase === "failed") return <span style={{ color: "#ef4444" }}>✕</span>;
  return <span style={{ color: "#6b7280" }}>○</span>;
}

function ApplicationStatusRow({
  item,
  onRetry,
}: {
  item: ApplicationStatusItem;
  onRetry?: (id: string) => void;
}) {
  const phase =
    item.evaluation_status !== "pending"
      ? item.evaluation_status
      : item.research_status;
  const error = item.last_evaluation_error || item.last_research_error;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "1px solid var(--bf-border, #333)",
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <StatusIcon phase={phase} />
        <span>{item.full_name}</span>
        <span style={{ fontSize: 11, color: "var(--text-dim, #888)" }}>{phase}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {error && (
          <span
            style={{
              fontSize: 11,
              color: "#ef4444",
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={error}
          >
            {error}
          </span>
        )}
        {phase === "failed" && onRetry && (
          <button
            onClick={() => onRetry(item.id)}
            style={{
              fontSize: 11,
              color: "#f59e0b",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

function CriterionRow({
  name,
  criterion,
  isActive,
}: {
  name: string;
  criterion: { reasoning: string; score: number | null; maxScore: number | null; summary: string | null };
  isActive: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive, criterion.reasoning]);

  const isComplete = criterion.score !== null;

  return (
    <div ref={ref} className="py-2 border-b border-dark-s-700 last:border-0">
      <div className="flex items-center gap-2 text-sm">
        <span className="shrink-0 w-4 text-center">
          {isComplete ? (
            <span className="text-green-400">&#10003;</span>
          ) : isActive ? (
            <span className="text-amber-400 animate-pulse">&#9654;</span>
          ) : (
            <span className="text-dark-s-500">&#9675;</span>
          )}
        </span>
        <span className={`font-medium ${isComplete ? "text-dark-s-100" : isActive ? "text-dark-s-0" : "text-dark-s-400"}`}>
          {name}
        </span>
        {isComplete && criterion.maxScore !== null && (
          <span className="ml-auto text-xs font-semibold tabular-nums text-dark-s-200">
            {criterion.score}/{criterion.maxScore}
          </span>
        )}
      </div>
      {(isActive || isComplete) && criterion.reasoning && (
        <div className="ml-6 mt-1 text-xs text-dark-s-300 leading-relaxed whitespace-pre-wrap">
          {criterion.summary || criterion.reasoning}
          {isActive && !isComplete && (
            <span className="inline-block w-1.5 h-3.5 bg-amber-400 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
      )}
    </div>
  );
}

function StreamingApplicantView({
  applicantId,
  applicant,
  index,
  totalApplicants,
  isCurrent,
}: {
  applicantId: string;
  applicant: ApplicantStreamState;
  index: number;
  totalApplicants: number;
  isCurrent: boolean;
}) {
  const criteriaEntries = Array.from(applicant.criteria.entries());
  // The last criterion with reasoning but no score is the active one
  const activeCriterion = criteriaEntries.findLast(
    ([, c]) => c.score === null && c.reasoning.length > 0
  )?.[0];

  return (
    <div className={`rounded-lg border px-3 py-2 ${
      isCurrent
        ? "border-amber-600/50 bg-amber-950/20"
        : applicant.status === "complete"
          ? "border-green-600/30 bg-green-950/10"
          : applicant.status === "error"
            ? "border-red-600/30 bg-red-950/10"
            : "border-dark-s-700 bg-dark-s-800/50"
    }`}>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-dark-s-100">
          {applicant.name}
          <span className="ml-2 text-xs text-dark-s-400">
            ({index + 1}/{totalApplicants})
          </span>
        </span>
        {applicant.status === "complete" && applicant.overallScore !== null && (
          <span className="text-xs font-semibold text-green-400">
            {applicant.overallScore.toFixed(1)}
          </span>
        )}
        {applicant.status === "error" && (
          <span className="text-xs font-semibold text-red-400">Error</span>
        )}
      </div>

      {(isCurrent || applicant.status === "complete") && criteriaEntries.length > 0 && (
        <div className="max-h-48 overflow-y-auto">
          {criteriaEntries.map(([name, criterion]) => (
            <CriterionRow
              key={`${applicantId}-${name}`}
              name={name}
              criterion={criterion}
              isActive={isCurrent && name === activeCriterion}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const PIPELINE_PHASES = [
  "init_run",
  "fork_review_bonfire",
  "generate_ontology",
  "chunk_applicants",
  "dispatch_research",
  "ingest_to_kg",
  "build_trimtab",
  "dispatch_scorers",
  "aggregate_scores",
  "persist_reviews",
  "finalize_run",
] as const;

function phaseIndex(phase: string | null): number {
  if (!phase) return -1;
  const idx = PIPELINE_PHASES.indexOf(phase as (typeof PIPELINE_PHASES)[number]);
  return idx >= 0 ? idx : -1;
}

function StreamingView({
  streamState,
  onCancel,
  compact = false,
}: {
  streamState: BatchStreamState;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const currentIdx = phaseIndex(streamState.graphPhase);
  const isComplete = streamState.status === "complete";

  return (
    <div className="space-y-4">
      {/* Pipeline steps */}
      <div className="space-y-1">
        {PIPELINE_PHASES.map((phase, idx) => {
          const isCurrent = idx === currentIdx && !isComplete;
          const isDone = isComplete || idx < currentIdx;
          const label = PHASE_LABELS[phase] ?? phase;

          // Progress text for research/scoring phases
          let progressText: string | null = null;
          if (isCurrent && phase === "dispatch_research" && streamState.phaseProgress["research_total"] != null) {
            progressText = `${streamState.phaseProgress["researched"] ?? 0} / ${streamState.phaseProgress["research_total"]}`;
          } else if (isCurrent && phase === "dispatch_scorers" && streamState.phaseProgress["scoring_total"] != null) {
            progressText = `${streamState.phaseProgress["scored"] ?? 0} / ${streamState.phaseProgress["scoring_total"]}`;
          }

          return (
            <div
              key={phase}
              className={`flex items-center gap-2 ${compact ? "py-0.5 text-xs" : "rounded px-2 py-1.5 text-sm"} transition-colors ${
                isCurrent
                  ? compact ? "text-amber-300" : "bg-amber-950/40 text-amber-200"
                  : isDone
                    ? "text-dark-s-400"
                    : "text-dark-s-600"
              }`}
            >
              {/* Status indicator */}
              <div className="flex-shrink-0 w-4 text-center">
                {isCurrent ? (
                  <div className="h-2 w-2 mx-auto rounded-full bg-amber-400 animate-pulse" />
                ) : isDone ? (
                  <span className="text-green-500 text-xs">&#10003;</span>
                ) : (
                  <div className="h-1.5 w-1.5 mx-auto rounded-full bg-dark-s-600" />
                )}
              </div>

              {/* Label */}
              <span className={isCurrent ? "font-medium" : ""}>{label}</span>

              {/* Progress counter */}
              {!compact && progressText && (
                <span className="ml-auto tabular-nums text-xs text-amber-400/80">
                  {progressText}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion summary */}
      {!compact && isComplete && streamState.durationSeconds !== null && (
        <div className="rounded-lg border border-green-600/30 bg-green-950/20 px-4 py-3 text-sm text-green-400">
          Completed in {streamState.durationSeconds.toFixed(1)}s
          {streamState.completedApplicants > 0 && ` — ${streamState.completedApplicants} applicants scored`}
          {streamState.skippedCount > 0 && ` (${streamState.skippedCount} skipped)`}
        </div>
      )}

      {/* Error display */}
      {!compact && streamState.error && (
        <div className="rounded-lg border border-red-600/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {streamState.error}
        </div>
      )}

      {/* Cancel button */}
      {!compact && (streamState.status === "streaming" || streamState.status === "connecting") && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost border border-red-600/50 text-red-400 hover:bg-red-950/30"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export function BatchProgressModal({
  isOpen,
  onClose,
  batch,
  reevaluateProgress,
  onReevaluateAll,
  streamState,
  onCancel,
  onRetryApplication,
  reviewBonfireId,
}: BatchProgressModalProps) {
  const [appDetailsOpen, setAppDetailsOpen] = useState(false);
  const hasFailures = batch?.application_items?.some(
    (a) => a.research_status === "failed" || a.evaluation_status === "failed"
  ) ?? false;

  // Auto-open when failures first appear
  useEffect(() => {
    if (hasFailures) setAppDetailsOpen(true);
  }, [hasFailures]);

  const total = batch?.imported_count ?? 0;
  const researchDone = batch?.research_completed_count ?? 0;
  const evalDone = batch?.evaluation_completed_count ?? 0;
  const shortlisted = batch?.shortlisted_count ?? 0;

  const isStreaming =
    streamState &&
    streamState.status !== "idle";
  const isReevaluating = reevaluateProgress != null || isStreaming;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Progress"
      size="lg"
      className={isStreaming ? "max-w-3xl" : "max-w-[480px]"}
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-s-200">{batch?.name ?? "—"}</span>
          {batch && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-dark-s-700 text-dark-s-100"
              data-element-id="batch-status-badge"
            >
              {batch.status}
            </span>
          )}
        </div>

        {/* Phase-driven streaming view */}
        {isStreaming && streamState ? (
          <div className="relative min-h-[400px]">
            {/* Graph fills the background */}
            <ReviewGraphPanel
              streamState={streamState}
              reviewBonfireId={reviewBonfireId}
              className="absolute inset-0 rounded-lg overflow-hidden"
            />
            {/* Pipeline overlay */}
            <div className="relative z-10 pointer-events-none">
              <div className="inline-block bg-dark-s-950/90 backdrop-blur-sm border border-dark-s-700 rounded-lg p-3 m-2 pointer-events-auto max-w-[200px]">
                <StreamingView streamState={streamState} onCancel={onCancel} compact />
              </div>
            </div>
          </div>
        ) : (
          /* Static batch summary when not streaming */
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-dark-s-200">Imported</span>
              <span className="font-semibold tabular-nums text-dark-s-0">
                {total} applicants
              </span>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-s-200">Evaluated</span>
                <span className="font-semibold tabular-nums text-dark-s-0">
                  {evalDone} / {total}
                </span>
              </div>
              <ProgressBar value={evalDone} total={total} className="h-full rounded bg-purple-500" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-s-200">Shortlisted</span>
              <span className="font-semibold tabular-nums text-dark-s-0">
                {shortlisted}
              </span>
            </div>
          </div>
        )}

        <hr className="border-dark-s-700" />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost border border-dark-s-600 text-dark-s-200 hover:bg-dark-s-700"
            data-element-id="close-batch-progress"
          >
            Close
          </button>
          {onReevaluateAll && (
            <button
              type="button"
              onClick={onReevaluateAll}
              disabled={isReevaluating}
              className="btn btn-primary bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
              data-element-id="reevaluate-all"
            >
              {isReevaluating ? "Re-evaluating..." : "Re-evaluate All"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
