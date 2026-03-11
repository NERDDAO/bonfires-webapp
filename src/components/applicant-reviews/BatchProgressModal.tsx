"use client";

import { useEffect, useRef } from "react";

import { Modal } from "@/components/ui/modal";
import type {
  ApplicantStreamState,
  BatchStreamState,
} from "@/hooks/queries/useBatchEvaluateStream";
import type { ApplicantReviewBatchInfo } from "@/types/applicant-reviews";

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

function StreamingView({
  streamState,
  onCancel,
}: {
  streamState: BatchStreamState;
  onCancel?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const applicantEntries = Array.from(streamState.applicants.entries());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamState.currentApplicantId, streamState.completedApplicants]);

  return (
    <div className="space-y-3">
      {/* Overall progress */}
      <div>
        <div className="flex justify-between text-sm">
          <span className="text-dark-s-200">Overall Progress</span>
          <span className="font-semibold tabular-nums text-dark-s-0">
            {streamState.completedApplicants} / {streamState.totalApplicants} applicants
          </span>
        </div>
        <ProgressBar
          value={streamState.completedApplicants}
          total={streamState.totalApplicants}
          className="h-full rounded bg-primary"
        />
        {streamState.status === "complete" && streamState.durationSeconds !== null && (
          <div className="text-xs text-dark-s-400 mt-1">
            Completed in {streamState.durationSeconds.toFixed(1)}s
            {streamState.skippedCount > 0 && ` (${streamState.skippedCount} skipped)`}
          </div>
        )}
      </div>

      {/* Applicant stream */}
      <div
        ref={scrollRef}
        className="space-y-2 max-h-[400px] overflow-y-auto pr-1"
      >
        {applicantEntries.map(([id, applicant], index) => (
          <StreamingApplicantView
            key={id}
            applicantId={id}
            applicant={applicant}
            index={index}
            totalApplicants={streamState.totalApplicants}
            isCurrent={streamState.currentApplicantId === id}
          />
        ))}
      </div>

      {/* Error display */}
      {streamState.error && (
        <div className="rounded-lg border border-red-600/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {streamState.error}
        </div>
      )}

      {/* Cancel button */}
      {streamState.status === "streaming" || streamState.status === "connecting" ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost border border-red-600/50 text-red-400 hover:bg-red-950/30"
          >
            Cancel
          </button>
        </div>
      ) : null}
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
}: BatchProgressModalProps) {
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
      className={isStreaming ? "max-w-2xl" : "max-w-[480px]"}
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

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-dark-s-200">Imported</span>
            <span className="font-semibold tabular-nums text-dark-s-0">
              {total} applicants
            </span>
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-s-200">Research</span>
              <span className="font-semibold tabular-nums text-dark-s-0">
                {researchDone} / {total}
              </span>
            </div>
            <ProgressBar value={researchDone} total={total} className="h-full rounded bg-blue-600" />
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-s-200">Evaluation</span>
              <span className="font-semibold tabular-nums text-dark-s-0">
                {evalDone} / {total}
              </span>
            </div>
            <ProgressBar value={evalDone} total={total} className="h-full rounded bg-purple-500" />
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-s-200">Shortlisted</span>
              <span className="font-semibold tabular-nums text-dark-s-0">
                {shortlisted}
              </span>
            </div>
            <ProgressBar value={shortlisted} total={total || 1} className="h-full rounded bg-amber-500" />
          </div>
        </div>

        {/* Streaming view — replaces the old simple progress indicator */}
        {isStreaming && streamState ? (
          <StreamingView streamState={streamState} onCancel={onCancel} />
        ) : isReevaluating && reevaluateProgress ? (
          <div className="rounded-lg border border-amber-600/50 bg-amber-950/30 px-4 py-3 flex items-center gap-3">
            <div
              className="h-4 w-4 shrink-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"
              aria-hidden
            />
            <div>
              <div className="text-sm font-semibold text-amber-500">
                Re-evaluating batch...
              </div>
              <div className="text-xs text-amber-600">
                {reevaluateProgress.completed} / {reevaluateProgress.total} applicants
                re-scored
              </div>
            </div>
          </div>
        ) : null}

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
