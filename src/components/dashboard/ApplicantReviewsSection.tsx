"use client";

import { useMemo, useState } from "react";

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
import { BatchProgressModal } from "@/components/applicant-reviews/BatchProgressModal";
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

  const batchProgress = useBatchProgress();
  const applicationActions = useApplicationActions();
  const profileModal = useProfileModal();
  const isActive = batchProgress.isOpen || applicationActions.isReevaluating;

  const reviewsQuery = useApplicantReviewsQuery({
    bonfireId,
    batchId,
    sortBy,
    sortOrder,
    shortlistOnly,
    refetchInterval: isActive ? 4000 : 15000,
  });
  const detailQuery = useApplicantReviewDetail({
    applicationId: selectedApplicationId,
    refetchInterval: isActive ? 4000 : 15000,
  });

  const applications = reviewsQuery.data?.items ?? [];
  const selectedApplication = detailQuery.data?.application;
  const selectedReview = detailQuery.data?.review;
  const selectedIdentity = detailQuery.data?.identity;

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
      batchProgress.open(response.batch_id);
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
                batchProgress.open(batchId ?? "");
                void (async () => {
                  try {
                    await applicationActions.reevaluateAll(
                      applications.map((a) => a.id),
                      batchId ?? undefined,
                    );
                    await queryClient.invalidateQueries({
                      queryKey: ["applicantReviewBatch"],
                    });
                    await refreshData();
                    applicationActions.clearProgress();
                    toast.success("Re-evaluation complete.");
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
            <>
              <span className="text-sm text-base-content/70">
                Batch: <span className="font-mono">{batchId}</span>
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => batchProgress.open(batchId)}
              >
                View progress
              </button>
            </>
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
                    await applicationActions.reevaluateAll(
                      applications.map((a) => a.id),
                      batchId,
                    );
                    await queryClient.invalidateQueries({
                      queryKey: ["applicantReviewBatch"],
                    });
                    await refreshData();
                    applicationActions.clearProgress();
                    toast.success("Re-evaluation complete.");
                  } catch (err) {
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "Re-evaluation failed.",
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
                onChange={(event) => setSortBy(event.target.value)}
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
                onChange={(event) =>
                  setSortOrder(event.target.value === "asc" ? "asc" : "desc")
                }
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
                onChange={(event) => setShortlistOnly(event.target.checked)}
              />
            </label>
          </div>

          {reviewsQuery.isLoading ? (
            <div className="p-8 text-center text-sm text-base-content/60">
              Loading applicants...
            </div>
          ) : !hasData ? (
            <div className="rounded-xl border border-dashed border-base-300 p-8 text-center text-sm text-base-content/60">
              No applicants found. Import a batch above to begin reviewing.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Score</th>
                    <th>Confidence</th>
                    <th>Status</th>
                    <th>Shortlist</th>
                    <th className="w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr
                      key={application.id}
                      className={`cursor-pointer hover ${
                        selectedApplicationId === application.id
                          ? "bg-base-200"
                          : ""
                      }`}
                      onClick={() => setSelectedApplicationId(application.id)}
                    >
                      <td>
                        <div className="font-medium">
                          {application.full_name}
                        </div>
                        <div className="text-xs text-base-content/60">
                          {application.role_title || "Role not provided"}
                        </div>
                      </td>
                      <td>{application.overall_score?.toFixed(1) ?? "—"}</td>
                      <td>
                        {application.confidence_score !== null &&
                        application.confidence_score !== undefined
                          ? `${Math.round(application.confidence_score * 100)}%`
                          : "—"}
                      </td>
                      <td>
                        <div className="text-xs">
                          <div>{application.research_status}</div>
                          <div>{application.evaluation_status}</div>
                        </div>
                      </td>
                      <td>{application.shortlist_status}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="btn btn-xs"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleShortlistToggle(application);
                            }}
                            disabled={!!actionIds[application.id]}
                          >
                            {application.shortlist_status === "shortlisted"
                              ? "Unshortlist"
                              : "Shortlist"}
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={(event) => {
                              event.stopPropagation();
                              void runAction(
                                application.id,
                                () =>
                                  apiClient.post<ApplicantReviewActionResponse>(
                                    `/api/applicant-reviews/${application.id}/retry-research`,
                                    {},
                                  ),
                                "Research retriggered.",
                              );
                            }}
                            disabled={!!actionIds[application.id]}
                          >
                            Retry
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={(event) => {
                              event.stopPropagation();
                              batchProgress.open(batchId ?? "");
                              applicationActions.startSingleRescore();
                              setActionIds((prev) => ({
                                ...prev,
                                [application.id]: true,
                              }));
                              void (async () => {
                                try {
                                  await apiClient.post<ApplicantReviewActionResponse>(
                                    `/api/applicant-reviews/${application.id}/evaluate`,
                                    {},
                                  );
                                  toast.success("Evaluation queued.");
                                  await refreshData();
                                } catch (error) {
                                  toast.error(
                                    error instanceof Error
                                      ? error.message
                                      : "Action failed unexpectedly",
                                  );
                                } finally {
                                  setActionIds((prev) => ({
                                    ...prev,
                                    [application.id]: false,
                                  }));
                                  applicationActions.completeSingleRescore();
                                }
                              })();
                            }}
                            disabled={!!actionIds[application.id]}
                          >
                            Re-score
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="sticky top-20 self-start rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm max-h-[calc(100vh-6rem)] overflow-y-auto">
          {!selectedApplicationId ? (
            <div className="text-sm text-base-content/60">
              Select an applicant to inspect their normalized profile, evidence,
              and rubric breakdown.
            </div>
          ) : detailQuery.isLoading ? (
            <div className="text-sm text-base-content/60">
              Loading applicant detail...
            </div>
          ) : selectedApplication ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedApplication.full_name}
                </h2>
                <p className="text-sm text-base-content/70">
                  {selectedApplication.role_title || "Role not provided"}
                </p>
              </div>

              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Ethereum:</span>{" "}
                  {selectedIdentity?.ethereum_address ||
                    selectedApplication.ethereum_address ||
                    "—"}
                </div>
                <div>
                  <span className="font-medium">GitHub:</span>{" "}
                  {selectedIdentity?.github_url ||
                    selectedApplication.github_profile_url ||
                    "—"}
                </div>
                <div>
                  <span className="font-medium">Twitter/X:</span>{" "}
                  {selectedIdentity?.twitter_url ||
                    selectedApplication.twitter_handle ||
                    "—"}
                </div>
                <div>
                  <span className="font-medium">Telegram:</span>{" "}
                  {selectedIdentity?.telegram_url || "—"}
                </div>
              </div>

              {selectedReview && (
                <div className="rounded-xl border border-base-300 p-4 space-y-3">
                  <div>
                    <div className="text-sm font-medium">
                      Score {selectedReview.weighted_score.toFixed(1)} / 100
                    </div>
                    <div className="text-xs text-base-content/60">
                      {selectedReview.recommendation} · confidence{" "}
                      {Math.round(selectedReview.confidence_score * 100)}%
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm w-full border border-primary text-primary"
                    onClick={() => profileModal.open()}
                    data-element-id="view-full-profile"
                  >
                    View Full Profile
                  </button>

                  <div>
                    <h4 className="text-xs font-semibold">Bio</h4>
                    <p className="mt-1 text-sm">
                      {selectedReview.bio || "No generated bio for this review."}
                    </p>
                  </div>

                  <p className="text-sm">{selectedReview.rationale}</p>

                  <div className="space-y-2">
                    {selectedReview.category_scores.map((category) => (
                      <div key={category.name}>
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span>{category.name}</span>
                          <span>{category.score}</span>
                        </div>
                        <progress
                          className="progress progress-primary w-full"
                          value={category.score}
                          max={100}
                        />
                        {category.reasoning && (
                          <p className="mt-0.5 text-xs text-base-content/60">
                            {category.reasoning}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedReview.strengths.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-success">
                        Strengths
                      </h4>
                      <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                        {selectedReview.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReview.concerns.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-warning">
                        Concerns
                      </h4>
                      <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                        {selectedReview.concerns.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReview.comparative_reasoning && (
                    <div>
                      <h4 className="text-xs font-semibold text-info">
                        Comparative Analysis
                      </h4>
                      <p className="mt-1 text-xs">
                        {selectedReview.comparative_reasoning}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-semibold">Evidence Links</h3>
                <ul className="space-y-1 text-sm">
                  {selectedApplication.public_evidence_links?.length ? (
                    selectedApplication.public_evidence_links.map((link) => (
                      <li key={link} className="break-all text-primary">
                        <a href={link} target="_blank" rel="noreferrer">
                          {link}
                        </a>
                      </li>
                    ))
                  ) : (
                    <li className="text-base-content/60">
                      No public links listed.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-sm text-base-content/60">
              Unable to load applicant detail.
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
