"use client";

import { useEffect, useMemo, useState } from "react";

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
import { ApplicantDetailSidebar } from "@/components/applicant-reviews/ApplicantDetailSidebar";
import { ApplicantReviewsTable } from "@/components/applicant-reviews/ApplicantReviewsTable";
import { BatchProgressModal } from "@/components/applicant-reviews/BatchProgressModal";
import { FullProfileModal } from "@/components/applicant-reviews/FullProfileModal";
import {
  useRubricListQuery,
  useStructuredRubricQuery,
} from "@/hooks/queries/useRubricQuery";
import { SlotRankingPanel } from "@/components/applicant-reviews/SlotRankingPanel";
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

export default function ApplicantReviewsPage() {
  const queryClient = useQueryClient();
  const [bonfireId, setBonfireId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [tableText, setTableText] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const [importMode, setImportMode] = useState<"tsv" | "json">("tsv");
  const [jsonText, setJsonText] = useState("");
  const [columnMapEnabled, setColumnMapEnabled] = useState(false);
  const [columnMapText, setColumnMapText] = useState("{}");
  const [isImporting, setIsImporting] = useState(false);
  const [actionIds, setActionIds] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;
  const [selectedRubricDocId, setSelectedRubricDocId] = useState<string | null>(null);
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null);

  const batchProgress = useBatchProgress();
  const applicationActions = useApplicationActions();
  const profileModal = useProfileModal();
  const isActive = batchProgress.isOpen || applicationActions.isReevaluating;

  const rubricListQuery = useRubricListQuery(bonfireId || null);
  const structuredRubricQuery = useStructuredRubricQuery(selectedRubricDocId, bonfireId || null);

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

  const handleImport = async () => {
    if (!bonfireId.trim()) {
      toast.error("Bonfire ID is required.");
      return;
    }
    if (importMode === "tsv" && !tableText.trim()) {
      toast.error("Paste table text is required for TSV import.");
      return;
    }
    if (importMode === "json" && !jsonText.trim()) {
      toast.error("JSON rows are required for JSON import.");
      return;
    }

    setIsImporting(true);
    try {
      const payload = {
        bonfire_id: bonfireId.trim(),
        agent_id: agentId.trim() || undefined,
        batch_name: `Applicant Batch ${new Date().toISOString()}`,
        source_name: importMode === "tsv" ? "manual-paste" : "json-import",
        ...(importMode === "tsv"
          ? { table_text: tableText }
          : {
              rows: JSON.parse(jsonText),
              column_map: columnMapEnabled ? JSON.parse(columnMapText) : {},
            }),
      };
      const response = await apiClient.post<ApplicantReviewBatchImportResponse>(
        "/api/applicant-review-batches/import",
        payload,
      );
      setBatchId(response.batch_id);
      batchProgress.open(response.batch_id);
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

  return (
    <div className="space-y-6">
      <section className="bf-review-panel">
        <div className="bf-import-card">
          <div className="bf-section-label">IMPORT</div>
          <h3>Applicant Reviews</h3>

          <div style={{ marginBottom: 20 }}>
            <div className="bf-mode-toggle">
              <button
                className={importMode === "tsv" ? "active" : ""}
                onClick={() => setImportMode("tsv")}
              >
                TSV
              </button>
              <button
                className={importMode === "json" ? "active" : ""}
                onClick={() => setImportMode("json")}
              >
                JSON
              </button>
            </div>
          </div>

          <div className="bf-grid-2" style={{ marginBottom: 16 }}>
            <div>
              <span className="bf-label">Bonfire ID</span>
              <input
                className="bf-input"
                value={bonfireId}
                onChange={(event) => setBonfireId(event.target.value)}
                placeholder="Mongo ObjectId bonfire identifier"
              />
            </div>
            <div>
              <span className="bf-label">Review Agent ID</span>
              <input
                className="bf-input"
                value={agentId}
                onChange={(event) => setAgentId(event.target.value)}
                placeholder="Optional agent for stack / episode writeback"
              />
            </div>
          </div>

          {importMode === "tsv" ? (
            <div style={{ marginBottom: 16 }}>
              <span className="bf-label">Paste table text</span>
              <textarea
                className="bf-textarea"
                value={tableText}
                onChange={(event) => setTableText(event.target.value)}
                placeholder="Paste TSV copied from Excel or Google Sheets"
              />
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <span className="bf-label">JSON rows (Artizen export)</span>
                <textarea
                  className="bf-textarea"
                  value={jsonText}
                  onChange={(event) => setJsonText(event.target.value)}
                  placeholder='[{"Full Name": "Alice", "Email": "alice@example.com", ...}]'
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div
                  className="bf-collapsible-header"
                  onClick={() => setColumnMapEnabled(!columnMapEnabled)}
                >
                  <div className="bf-ember-line" />
                  <span className="bf-label">Column Mapping</span>
                  <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {columnMapEnabled ? "Custom" : "Passthrough (auto)"}
                  </span>
                </div>
                {columnMapEnabled && (
                  <div style={{ marginTop: 8 }}>
                    <textarea
                      className="bf-textarea"
                      style={{ minHeight: 80 }}
                      value={columnMapText}
                      onChange={(e) => setColumnMapText(e.target.value)}
                      placeholder='{"Source Column": "target_field", ...}'
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-dim)",
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      Empty {"{}"} = auto snake_case all keys
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <button
              className="bf-btn-primary"
              onClick={() => void handleImport()}
              disabled={isImporting}
            >
              {isImporting ? "Importing..." : "Import Batch"}
            </button>
            {batchId && (
              <>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Active batch:{" "}
                  <span style={{ fontFamily: "monospace" }}>{batchId}</span>
                </span>
                <button
                  type="button"
                  className="bf-btn-secondary"
                  onClick={() => batchProgress.open(batchId)}
                >
                  View progress
                </button>
                {applications.length > 0 && (
                  <button
                    type="button"
                    className="bf-btn-primary"
                    onClick={() => {
                      batchProgress.open(batchId);
                      void (async () => {
                        try {
                          const needsEvaluation = applications.filter(
                            (a) => a.evaluation_status !== "completed",
                          );
                          if (needsEvaluation.length === 0) {
                            toast.success("All applications already evaluated.");
                            return;
                          }
                          await applicationActions.reevaluateAll(
                            needsEvaluation.map((a) => a.id),
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
                    }}
                    disabled={applicationActions.isReevaluating}
                  >
                    {applicationActions.isReevaluating
                      ? "Re-evaluating..."
                      : "Re-evaluate All"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <BatchProgressModal
        isOpen={batchProgress.isOpen}
        onClose={batchProgress.close}
        batch={batchProgress.batch}
        reevaluateProgress={applicationActions.reevaluateProgress}
        streamState={applicationActions.streamState}
        onCancel={applicationActions.cancelStream}
        onReevaluateAll={
          batchId && applications.length > 0
            ? () => {
                void (async () => {
                  try {
                    const needsEvaluation = applications.filter(
                      (a) => a.evaluation_status !== "completed",
                    );
                    if (needsEvaluation.length === 0) {
                      toast.success("All applications already evaluated.");
                      return;
                    }
                    await applicationActions.reevaluateAll(
                      needsEvaluation.map((a) => a.id),
                      batchId,
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
              }
            : undefined
        }
      />

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
              disabled={!bonfireId}
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

          {!bonfireId ? (
            <div className="rounded-xl border border-dashed border-base-300 p-8 text-center text-sm text-base-content/60">
              Enter a bonfire ID and import a batch to begin reviewing.
            </div>
          ) : reviewsQuery.isLoading ? (
            <div className="p-8 text-center text-sm text-base-content/60">
              Loading applicants...
            </div>
          ) : !hasData ? (
            <div className="rounded-xl border border-dashed border-base-300 p-8 text-center text-sm text-base-content/60">
              No applicants found for the current query.
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
