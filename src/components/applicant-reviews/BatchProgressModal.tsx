"use client";

import { Modal } from "@/components/ui/modal";
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

export function BatchProgressModal({
  isOpen,
  onClose,
  batch,
  reevaluateProgress,
  onReevaluateAll,
}: BatchProgressModalProps) {
  const total = batch?.imported_count ?? 0;
  const researchDone = batch?.research_completed_count ?? 0;
  const evalDone = batch?.evaluation_completed_count ?? 0;
  const shortlisted = batch?.shortlisted_count ?? 0;
  const isReevaluating = reevaluateProgress != null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Progress"
      size="lg"
      className="max-w-[480px]"
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
            <ProgressBar value={researchDone} total={total} className="bg-blue-600" />
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-s-200">Evaluation</span>
              <span className="font-semibold tabular-nums text-dark-s-0">
                {evalDone} / {total}
              </span>
            </div>
            <ProgressBar value={evalDone} total={total} className="bg-purple-500" />
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-s-200">Shortlisted</span>
              <span className="font-semibold tabular-nums text-dark-s-0">
                {shortlisted}
              </span>
            </div>
            <ProgressBar value={shortlisted} total={total || 1} className="bg-amber-500" />
          </div>
        </div>

        {isReevaluating && reevaluateProgress && (
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
