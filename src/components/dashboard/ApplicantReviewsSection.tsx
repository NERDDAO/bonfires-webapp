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
import { useProfileModal } from "@/hooks/queries/useProfileModal";
import {
  useRubricListQuery,
  useStructuredRubricQuery,
} from "@/hooks/queries/useRubricQuery";
import { ApplicantDetailSidebar } from "@/components/applicant-reviews/ApplicantDetailSidebar";
import { ApplicantReviewsTable } from "@/components/applicant-reviews/ApplicantReviewsTable";
import { FullProfileModal } from "@/components/applicant-reviews/FullProfileModal";
import { Modal } from "@/components/ui/modal";
import type {
  ApplicantReviewActionResponse,
  ApplicantReviewBatchImportResponse,
  ApplicantReviewListItem,
} from "@/types/applicant-reviews";

const SORT_OPTIONS = [
  { value: "score", label: "Score" },
  { value: "confidence", label: "Confidence" },
  { value: "updated_at", label: "Updated" },
  { value: "name", label: "Name" },
] as const;

interface ApplicantReviewsSectionProps {
  bonfireId: string;
}

export function ApplicantReviewsSection({
  bonfireId,
}: ApplicantReviewsSectionProps) {
  const queryClient = useQueryClient();
  const [agentId, setAgentId] = useState("");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [tableText, setTableText] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [actionIds, setActionIds] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;
  const [selectedRubricDocId, setSelectedRubricDocId] = useState<string | null>(null);
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null);

  const applicationActions = useApplicationActions();
  const profileModal = useProfileModal();
  const isActive = applicationActions.isReevaluating;
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

  const rubricListQuery = useRubricListQuery(bonfireId);
  const structuredRubricQuery = useStructuredRubricQuery(selectedRubricDocId, bonfireId);

  // Auto-select active/latest rubric on load
  useEffect(() => {
    if (rubricListQuery.data?.items.length && !selectedRubricDocId) {
      const active = rubricListQuery.data.items.find(r => r.is_active);
      const latest = rubricListQuery.data.items[0];
      const selected = active ?? latest;
      if (selected) setSelectedRubricDocId(selected.id);
    }
  }, [rubricListQuery.data, selectedRubricDocId]);

  useEffect(() => {
    if (structuredRubricQuery.data) {
      setSelectedRubricId(structuredRubricQuery.data.id);
      setPage(0);
    }
  }, [structuredRubricQuery.data]);

  const reviewsQuery = useApplicantReviewsQuery({
    bonfireId,
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
    rubricId: selectedRubricId,
    refetchInterval: isActive ? 4000 : 15000,
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

  const handleImport = async () => {
    if (!tableText.trim()) {
      toast.error("Pasted table text is required.");
      return;
    }

    setIsImporting(true);
    try {
      const response =
        await apiClient.post<ApplicantReviewBatchImportResponse>(
          "/api/applicant-review-batches/import",
          {
            bonfire_id: bonfireId,
            agent_id: agentId.trim() || undefined,
            batch_name: `Applicant Batch ${new Date().toISOString()}`,
            source_name: "manual-paste",
            table_text: tableText,
          },
        );
      setBatchId(response.batch_id);
      setIsImportModalOpen(false);
      setTableText("");
      toast.success(`Imported ${response.imported_count} applicant rows.`);
      await refreshData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Import failed unexpectedly",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleShortlistToggle = async (
    application: ApplicantReviewListItem,
  ) => {
    const shortlisted = application.shortlist_status !== "shortlisted";
    await runAction(
      application.id,
      () =>
        apiClient.post<ApplicantReviewActionResponse>(
          `/api/applicant-reviews/${application.id}/shortlist`,
          { shortlisted },
        ),
      shortlisted
        ? "Applicant shortlisted."
        : "Applicant removed from shortlist.",
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h2 className="text-xl font-semibold">Applicant Reviews</h2>
            <p className="text-sm text-base-content/70">
              Import, rank by score, and curate the top 25.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setIsImportModalOpen(true)}
          >
            Import Batch
          </button>

          {applications.length > 0 && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                void (async () => {
                  try {
                    const toEvaluate = selectedRubricId
                      ? applications
                      : applications.filter(
                          (a) => a.evaluation_status !== "completed",
                        );
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
                    await refreshData();
                    applicationActions.clearProgress();
                    applicationActions.cancelStream();
                  } catch (err) {
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "Re-evaluation failed.",
                    );
                  }
                })();
              }}
              disabled={applicationActions.isReevaluating}
            >
              {applicationActions.isReevaluating
                ? "Re-evaluating..."
                : "Rescore All"}
            </button>
          )}

          {batchId && (
            <span className="text-sm text-base-content/70">
              Batch: <span className="font-mono">{batchId}</span>
            </span>
          )}
        </div>
      </section>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Applicant Batch"
        size="lg"
      >
        <div className="space-y-4">
          <label className="form-control">
            <span className="label-text text-sm font-medium">
              Review Agent ID
            </span>
            <input
              className="input input-bordered"
              value={agentId}
              onChange={(event) => setAgentId(event.target.value)}
              placeholder="Optional agent for stack / episode writeback"
            />
          </label>

          <label className="form-control">
            <span className="label-text text-sm font-medium">
              Paste table text
            </span>
            <textarea
              className="textarea textarea-bordered min-h-48"
              value={tableText}
              onChange={(event) => setTableText(event.target.value)}
              placeholder="Paste TSV copied from Excel or Google Sheets"
            />
          </label>

          <div className="flex justify-end">
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={isImporting}
            >
              {isImporting ? "Importing..." : "Import Batch"}
            </button>
          </div>
        </div>
      </Modal>

      <FullProfileModal
        isOpen={profileModal.isOpen}
        onClose={profileModal.close}
        detail={detailQuery.data}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="form-control">
              <span className="label-text text-sm font-medium">Sort</span>
              <select
                className="select select-bordered"
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
              <span className="label-text text-sm font-medium">Order</span>
              <select
                className="select select-bordered"
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
              <span className="label-text">Shortlist only</span>
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
                <span className="label-text text-sm font-medium">Rubric</span>
                <select
                  className="select select-bordered"
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
              className="btn btn-ghost btn-sm mt-auto"
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

          {reviewsQuery.isLoading ? (
            <div className="p-8 text-center text-sm text-base-content/60">
              Loading applicants...
            </div>
          ) : !hasData ? (
            <div className="rounded-xl border border-dashed border-base-300 p-8 text-center text-sm text-base-content/60">
              No applicants found. Import a batch above to begin reviewing.
            </div>
          ) : (
            <ApplicantReviewsTable
              applications={applications}
              selectedApplicationId={selectedApplicationId}
              onSelectApplication={setSelectedApplicationId}
              actionIds={actionIds}
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
            />
          )}

          {reviewsQuery.data && reviewsQuery.data.total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-base-300">
              <span className="text-sm text-base-content/60">
                Showing {page * PAGE_SIZE + 1}&ndash;{Math.min((page + 1) * PAGE_SIZE, reviewsQuery.data.total)} of {reviewsQuery.data.total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn btn-sm btn-ghost disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * PAGE_SIZE >= reviewsQuery.data.total}
                  className="btn btn-sm btn-ghost disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="sticky top-20 self-start rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm max-h-[calc(100vh-6rem)] overflow-y-auto">
          <ApplicantDetailSidebar
            selectedApplicationId={selectedApplicationId}
            detail={detailQuery.data}
            isLoading={detailQuery.isLoading}
            selectedRubricId={selectedRubricId}
            rubricName={structuredRubricQuery.data?.name}
            actionIds={actionIds}
            onEvaluate={(appId) => {
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
