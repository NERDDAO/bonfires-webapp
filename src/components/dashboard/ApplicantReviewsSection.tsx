"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { apiClient } from "@/lib/api/client";
import {
  useApplicantReviewDetail,
  useApplicantReviewsQuery,
} from "@/hooks/queries/useApplicantReviewsQuery";
import { useApplicationActions } from "@/hooks/queries/useApplicationActions";
import { useBatchProgress } from "@/hooks/queries/useBatchProgress";
import { useProfileModal } from "@/hooks/queries/useProfileModal";
import {
  useRubricListQuery,
  useStructuredRubricQuery,
} from "@/hooks/queries/useRubricQuery";
import { ApplicantDetailSidebar } from "@/components/applicant-reviews/ApplicantDetailSidebar";
import { ApplicantReviewsTable } from "@/components/applicant-reviews/ApplicantReviewsTable";
import { BatchCreationModal } from "@/components/applicant-reviews/BatchCreationModal";
import { BatchProgressModal } from "@/components/applicant-reviews/BatchProgressModal";
import { FullProfileModal } from "@/components/applicant-reviews/FullProfileModal";
import { SlotRankingPanel } from "@/components/applicant-reviews/SlotRankingPanel";
import type {
  ApplicantReviewActionResponse,
  ApplicantReviewListItem,
} from "@/types/applicant-reviews";

const SORT_OPTIONS = [
  { value: "score", label: "Score" },
  { value: "confidence", label: "Confidence" },
  { value: "updated_at", label: "Updated" },
  { value: "name", label: "Name" },
] as const;

const PAGE_SIZE = 50;

interface ApplicantReviewsSectionProps {
  bonfireId: string;
}

export function ApplicantReviewsSection({
  bonfireId,
}: ApplicantReviewsSectionProps) {
  const queryClient = useQueryClient();
  const [batchId, setBatchId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const [actionIds, setActionIds] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);
  const [selectedRubricDocId, setSelectedRubricDocId] = useState<string | null>(null);
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null);

  const batchProgress = useBatchProgress();
  const applicationActions = useApplicationActions();
  const profileModal = useProfileModal();
  const isActive = batchProgress.isOpen || applicationActions.isReevaluating;
  const toastIdRef = useRef<string | null>(null);

  // Track reevaluation progress via toast
  useEffect(() => {
    const progress = applicationActions.reevaluateProgress;
    if (progress && progress.total > 0) {
      const msg = `Evaluating applicants... (${progress.completed}/${progress.total})`;
      if (toastIdRef.current) {
        toast.loading(msg, { id: toastIdRef.current });
      } else {
        toastIdRef.current = toast.loading(msg);
      }
    } else if (toastIdRef.current && !isActive) {
      toast.success("Evaluation complete", { id: toastIdRef.current });
      toastIdRef.current = null;
    }
  }, [applicationActions.reevaluateProgress, isActive]);

  const rubricListQuery = useRubricListQuery(bonfireId || null);
  const structuredRubricQuery = useStructuredRubricQuery(selectedRubricDocId, bonfireId || null);

  // Auto-select active/latest rubric on first load only
  const [rubricAutoSelected, setRubricAutoSelected] = useState(false);
  useEffect(() => {
    if (!rubricAutoSelected && rubricListQuery.data?.items.length) {
      const active = rubricListQuery.data.items.find(r => r.is_active);
      const latest = rubricListQuery.data.items[0];
      const selected = active ?? latest;
      if (selected) setSelectedRubricDocId(selected.id);
      setRubricAutoSelected(true);
    }
  }, [rubricListQuery.data, rubricAutoSelected]);

  useEffect(() => {
    if (structuredRubricQuery.data) {
      setSelectedRubricId(structuredRubricQuery.data.id);
      setPage(0);
    }
  }, [structuredRubricQuery.data]);

  const reviewsQuery = useApplicantReviewsQuery({
    bonfireId: bonfireId || null,
    batchId,
    sortBy,
    sortOrder,
    shortlistOnly,
    refetchInterval: isActive ? 4000 : 15000,
    page,
    limit: PAGE_SIZE,
    rubricId: selectedRubricId,
  });
  const detailQuery = useApplicantReviewDetail({
    applicationId: selectedApplicationId,
    refetchInterval: isActive ? 4000 : 15000,
    rubricId: selectedRubricId,
  });

  const applications = reviewsQuery.data?.items ?? [];
  const hasData = useMemo(() => applications.length > 0, [applications]);

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["applicantReviews"] }),
      queryClient.invalidateQueries({ queryKey: ["applicantReviewDetail"] }),
    ]);
  };

  const runAction = async (
    applicationId: string,
    action: () => Promise<ApplicantReviewActionResponse>,
    successMessage: string,
  ) => {
    setActionIds((prev) => ({ ...prev, [applicationId]: true }));
    try {
      await action();
      toast.success(successMessage);
      await refreshData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Action failed unexpectedly",
      );
    } finally {
      setActionIds((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  const handleShortlistToggle = async (application: ApplicantReviewListItem) => {
    const shortlisted = application.shortlist_status !== "shortlisted";
    await runAction(
      application.id,
      () =>
        apiClient.post<ApplicantReviewActionResponse>(
          `/api/applicant-reviews/${application.id}/shortlist`,
          { shortlisted },
        ),
      shortlisted ? "Applicant shortlisted." : "Applicant removed from shortlist.",
    );
  };

  const handleReevaluateAll = () => {
    batchProgress.open(batchId ?? "");
    void (async () => {
      try {
        const toEvaluate = selectedRubricId
          ? applications
          : applications.filter((a) => a.evaluation_status !== "completed");
        if (toEvaluate.length === 0) {
          toast.success("All applications already evaluated.");
          return;
        }
        await applicationActions.reevaluateAll(
          toEvaluate.map((a) => a.id),
          batchId ?? undefined,
          selectedRubricId,
          true,
        );
        await queryClient.invalidateQueries({
          queryKey: ["applicantReviewBatch"],
        });
        await refreshData();
        applicationActions.clearProgress();
        toast.success("Re-evaluation complete.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Re-evaluation failed.",
        );
      }
    })();
  };

  return (
    <div className="space-y-6">
      {/* ── Header + Actions ── */}
      <section className="bf-review-panel">
        <div className="bf-import-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="bf-section-label">APPLICANT REVIEWS</div>
            {batchId && (
              <span style={{ fontSize: 13, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                Batch: {batchId}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button className="bf-btn-primary" onClick={() => setCreateModalOpen(true)}>
              New Batch
            </button>

            {applications.length > 0 && (
              <button
                type="button"
                className="bf-btn-primary"
                onClick={handleReevaluateAll}
                disabled={applicationActions.isReevaluating}
              >
                {applicationActions.isReevaluating ? "Re-evaluating..." : "Rescore All"}
              </button>
            )}

            {batchId && (
              <button
                type="button"
                className="bf-btn-secondary"
                onClick={() => batchProgress.open(batchId)}
              >
                View progress
              </button>
            )}
          </div>
        </div>
      </section>

      <BatchCreationModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        bonfireId={bonfireId}
        onBatchCreated={(newBatchId) => {
          setBatchId(newBatchId);
          batchProgress.open(newBatchId);
          void refreshData();
        }}
      />

      <BatchProgressModal
        isOpen={batchProgress.isOpen}
        onClose={batchProgress.close}
        batch={batchProgress.batch}
        reevaluateProgress={applicationActions.reevaluateProgress}
        streamState={applicationActions.streamState}
        onCancel={applicationActions.cancelStream}
        onReevaluateAll={
          batchId && applications.length > 0
            ? () => handleReevaluateAll()
            : undefined
        }
        onRetryApplication={(appId) =>
          void runAction(
            appId,
            () => apiClient.post<ApplicantReviewActionResponse>(
              `/api/applicant-reviews/${appId}/retry-research`,
              {},
            ),
            "Research retriggered.",
          )
        }
      />

      <FullProfileModal
        isOpen={profileModal.isOpen}
        onClose={profileModal.close}
        detail={detailQuery.data}
      />

      {/* ── Table + Detail Sidebar ── */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div style={{ background: 'var(--bf-surface)', border: '1px solid var(--bf-border)', borderRadius: 'var(--bf-radius)', padding: 24 }}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="form-control">
              <span className="bf-label">Sort</span>
              <select
                className="bf-input"
                style={{ padding: '8px 12px' }}
                value={sortBy}
                onChange={(event) => { setSortBy(event.target.value); setPage(0); }}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="bf-label">Order</span>
              <select
                className="bf-input"
                style={{ padding: '8px 12px' }}
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(event.target.value === "asc" ? "asc" : "desc");
                  setPage(0);
                }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </label>

            <label className="label cursor-pointer gap-2 pt-6">
              <span className="bf-label" style={{ marginBottom: 0 }}>Shortlist only</span>
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={shortlistOnly}
                onChange={(event) => {
                  setShortlistOnly(event.target.checked);
                  setPage(0);
                }}
              />
            </label>

            {rubricListQuery.data && rubricListQuery.data.items.length > 0 && (
              <label className="form-control">
                <span className="bf-label">Rubric</span>
                <select
                  className="bf-input"
                  style={{ padding: '8px 12px' }}
                  value={selectedRubricDocId ?? "default"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "default") {
                      setSelectedRubricDocId(null);
                      setSelectedRubricId(null);
                    } else {
                      setSelectedRubricDocId(val);
                    }
                    setPage(0);
                  }}
                >
                  <option value="default">Default (v1)</option>
                  {rubricListQuery.data.items.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.version ? `(${r.version})` : ""} {r.is_active ? " [active]" : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              onClick={async () => {
                const params = new URLSearchParams({ bonfire_id: bonfireId });
                if (batchId) params.set("batch_id", batchId);
                if (selectedRubricId) params.set("rubric_id", selectedRubricId);
                const res = await fetch(`/api/applicant-reviews-export?${params}`);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "applicant_reviews.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              disabled={!bonfireId}
              className="bf-action-btn"
              style={{ marginTop: 'auto' }}
            >
              Export CSV
            </button>
          </div>

          {structuredRubricQuery.data && (
            <div className="collapse collapse-arrow border border-base-300 rounded-xl mb-4">
              <input type="checkbox" />
              <div className="collapse-title text-sm font-medium">
                {structuredRubricQuery.data.name} {structuredRubricQuery.data.version ? `(${structuredRubricQuery.data.version})` : ""}
              </div>
              <div className="collapse-content text-xs space-y-2">
                {structuredRubricQuery.data.categories.map((cat) => (
                  <div key={cat.name} className="border-b border-base-200 pb-2">
                    <div className="flex justify-between font-medium">
                      <span>{cat.name}</span>
                      <span>Weight: {cat.weight}%</span>
                    </div>
                    <ul className="ml-4 mt-1 list-disc list-inside text-base-content/70">
                      {cat.criteria.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {(structuredRubricQuery.data.passing_threshold != null || structuredRubricQuery.data.top25_threshold != null) && (
                  <div className="text-base-content/60 pt-1">
                    {structuredRubricQuery.data.passing_threshold != null && <span>Passing: {structuredRubricQuery.data.passing_threshold}</span>}
                    {structuredRubricQuery.data.top25_threshold != null && <span className="ml-3">Top 25: {structuredRubricQuery.data.top25_threshold}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {!bonfireId ? (
            <div className="p-8 text-center text-sm" style={{ border: '1px dashed var(--bf-border-bright)', borderRadius: 'var(--bf-radius)', color: 'var(--bf-text-dim)' }}>
              Select a bonfire to begin reviewing applicants.
            </div>
          ) : reviewsQuery.isLoading ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--bf-text-dim)' }}>
              Loading applicants...
            </div>
          ) : !hasData ? (
            <div className="p-8 text-center text-sm" style={{ border: '1px dashed var(--bf-border-bright)', borderRadius: 'var(--bf-radius)', color: 'var(--bf-text-dim)' }}>
              No applicants found. Import a batch above to begin reviewing.
            </div>
          ) : (
            <ApplicantReviewsTable
              applications={applications}
              selectedApplicationId={selectedApplicationId}
              onSelectApplication={setSelectedApplicationId}
              actionIds={actionIds}
              showOrgColumn
              onShortlistToggle={(app) => void handleShortlistToggle(app)}
              onRetryResearch={(app) =>
                void runAction(
                  app.id,
                  () =>
                    apiClient.post<ApplicantReviewActionResponse>(
                      `/api/applicant-reviews/${app.id}/retry-research`,
                      {},
                    ),
                  "Research retriggered.",
                )
              }
              onRescore={(app) => {
                batchProgress.open(batchId ?? "");
                applicationActions.startSingleRescore();
                setActionIds((prev) => ({ ...prev, [app.id]: true }));
                void (async () => {
                  try {
                    await apiClient.post<ApplicantReviewActionResponse>(
                      `/api/applicant-reviews/${app.id}/evaluate`,
                      { rubric_id: selectedRubricId ?? undefined },
                    );
                    toast.success("Evaluation queued.");
                    await refreshData();
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "Action failed unexpectedly",
                    );
                  } finally {
                    setActionIds((prev) => ({ ...prev, [app.id]: false }));
                    applicationActions.completeSingleRescore();
                  }
                })();
              }}
              onDelete={(app) => {
                if (!confirm(`Delete submission for ${app.full_name}?`)) return;
                setActionIds((prev) => ({ ...prev, [app.id]: true }));
                void (async () => {
                  try {
                    await apiClient.delete(`/api/applicant-reviews/${app.id}`);
                    toast.success("Submission deleted");
                    await refreshData();
                  } catch {
                    toast.error("Failed to delete");
                  } finally {
                    setActionIds((prev) => ({ ...prev, [app.id]: false }));
                  }
                })();
              }}
            />
          )}

          {batchId && applications.some(a => a.evaluation_status === "completed") && (
            <div className="bf-review-panel" style={{ marginTop: 24 }}>
              <SlotRankingPanel
                batchId={batchId}
                applications={applications}
                onSlotsAssigned={() => void refreshData()}
              />
            </div>
          )}

          {reviewsQuery.data && reviewsQuery.data.total > 0 && (
            <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--bf-border)', padding: '12px 16px' }}>
              <span style={{ fontSize: 14, color: 'var(--bf-text-secondary)' }}>
                Showing {page * PAGE_SIZE + 1}&ndash;{Math.min((page + 1) * PAGE_SIZE, reviewsQuery.data.total)} of {reviewsQuery.data.total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="bf-action-btn"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * PAGE_SIZE >= reviewsQuery.data.total}
                  className="bf-action-btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto" style={{ background: 'var(--bf-surface)', border: '1px solid var(--bf-border)', borderRadius: 'var(--bf-radius)', padding: 24 }}>
          <ApplicantDetailSidebar
            selectedApplicationId={selectedApplicationId}
            detail={detailQuery.data}
            isLoading={detailQuery.isLoading}
            selectedRubricId={selectedRubricId}
            rubricName={structuredRubricQuery.data?.name}
            actionIds={actionIds}
            onEvaluate={(appId) => {
              batchProgress.open(batchId ?? "");
              applicationActions.startSingleRescore();
              setActionIds((prev) => ({ ...prev, [appId]: true }));
              void (async () => {
                try {
                  await apiClient.post<ApplicantReviewActionResponse>(
                    `/api/applicant-reviews/${appId}/evaluate`,
                    { rubric_id: selectedRubricId },
                  );
                  toast.success("Evaluation queued.");
                  await refreshData();
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Action failed unexpectedly",
                  );
                } finally {
                  setActionIds((prev) => ({ ...prev, [appId]: false }));
                  applicationActions.completeSingleRescore();
                }
              })();
            }}
            onViewFullProfile={() => profileModal.open()}
          />
        </aside>
      </section>
    </div>
  );
}
