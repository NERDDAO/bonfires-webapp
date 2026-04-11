"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  useApplicantReviewDetail,
  useApplicantReviewsQuery,
} from "@/hooks/queries/useApplicantReviewsQuery";
import { useApplicationActions } from "@/hooks/queries/useApplicationActions";
import { useBatchProgress } from "@/hooks/queries/useBatchProgress";
import {
  useRubricListQuery,
  useStructuredRubricQuery,
} from "@/hooks/queries/useRubricQuery";
import { apiClient } from "@/lib/api/client";
import { ApplicantCard } from "@/components/applicant-reviews/ApplicantCard";
import { ApplicantProfile } from "@/components/applicant-reviews/ApplicantProfile";
import { BatchCreationModal } from "@/components/applicant-reviews/BatchCreationModal";
import { BatchOverview } from "@/components/applicant-reviews/BatchOverview";
import { BatchProgressModal } from "@/components/applicant-reviews/BatchProgressModal";
import { ReviewGraphPanel } from "@/components/applicant-reviews/ReviewGraphPanel";

const PAGE_SIZE = 500;

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
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRubricDocId, setSelectedRubricDocId] = useState<string | null>(null);
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const cardListRef = useRef<HTMLDivElement>(null);

  // Batch list for picker
  const batchListQuery = useQuery({
    queryKey: ["batchList", bonfireId],
    queryFn: () =>
      apiClient.get<{ items: Array<{ id: string; name: string; status: string; imported_count: number; created_at: string | null }> }>(
        `/api/applicant-review-batches?bonfire_id=${bonfireId}`,
        { cache: false },
      ),
    enabled: !!bonfireId,
  });

  // Auto-select latest batch if none selected
  useEffect(() => {
    const firstBatch = batchListQuery.data?.items?.[0];
    if (!batchId && firstBatch) {
      setBatchId(firstBatch.id);
    }
  }, [batchId, batchListQuery.data]);

  const batchProgress = useBatchProgress();
  const applicationActions = useApplicationActions();
  const isActive = batchProgress.isOpen || applicationActions.isReevaluating;
  const toastIdRef = useRef<string | null>(null);

  // Track reevaluation progress via toast
  useEffect(() => {
    const progress = applicationActions.reevaluateProgress;
    if (progress && progress.total > 0) {
      const msg = `Evaluating... (${progress.completed}/${progress.total})`;
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

  // Rubric auto-selection
  const rubricListQuery = useRubricListQuery(bonfireId || null);
  const structuredRubricQuery = useStructuredRubricQuery(selectedRubricDocId, bonfireId || null);

  const [rubricAutoSelected, setRubricAutoSelected] = useState(false);
  useEffect(() => {
    if (!rubricAutoSelected && rubricListQuery.data?.items.length) {
      const active = rubricListQuery.data.items.find((r) => r.is_active);
      const latest = rubricListQuery.data.items[0];
      const selected = active ?? latest;
      if (selected) setSelectedRubricDocId(selected.id);
      setRubricAutoSelected(true);
    }
  }, [rubricListQuery.data, rubricAutoSelected]);

  useEffect(() => {
    if (structuredRubricQuery.data) {
      setSelectedRubricId(structuredRubricQuery.data.id);
    }
  }, [structuredRubricQuery.data]);

  // Data queries
  const reviewsQuery = useApplicantReviewsQuery({
    bonfireId: bonfireId || null,
    batchId,
    sortBy,
    sortOrder,
    refetchInterval: isActive ? 4000 : 15000,
    page: 0,
    limit: PAGE_SIZE,
    rubricId: selectedRubricId,
  });
  const detailQuery = useApplicantReviewDetail({
    applicationId: selectedApplicationId,
    refetchInterval: isActive ? 4000 : 15000,
    rubricId: selectedRubricId,
  });

  const applications = reviewsQuery.data?.items ?? [];

  // Sort locally + filter by search
  const filteredApps = useMemo(() => {
    let sorted = [...applications];

    // Local sort
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "score") cmp = (a.overall_score ?? -1) - (b.overall_score ?? -1);
      else if (sortBy === "confidence") cmp = (a.confidence_score ?? -1) - (b.confidence_score ?? -1);
      else if (sortBy === "name") cmp = a.full_name.localeCompare(b.full_name);
      else if (sortBy === "updated_at") cmp = a.updated_at.localeCompare(b.updated_at);
      return sortOrder === "desc" ? -cmp : cmp;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      sorted = sorted.filter(
        (a) =>
          a.full_name.toLowerCase().includes(q) ||
          a.organizations?.some((o) => o.toLowerCase().includes(q)),
      );
    }

    return sorted;
  }, [applications, searchQuery, sortBy, sortOrder]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, sortBy, sortOrder]);

  const visibleApps = useMemo(() => filteredApps.slice(0, visibleCount), [filteredApps, visibleCount]);

  const handleCardListScroll = useCallback(() => {
    const el = cardListRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      setVisibleCount((prev) => Math.min(prev + 50, filteredApps.length));
    }
  }, [filteredApps.length]);

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["applicantReviews"] }),
      queryClient.invalidateQueries({ queryKey: ["applicantReviewDetail"] }),
    ]);
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
        await queryClient.invalidateQueries({ queryKey: ["applicantReviewBatch"] });
        await refreshData();
        applicationActions.clearProgress();
        toast.success("Re-evaluation complete.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Re-evaluation failed.");
      }
    })();
  };

  return (
    <div
      className="bf-review-panel"
      style={{ padding: 0, overflow: "hidden" }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "20px 24px",
          borderBottom: "1px solid var(--bf-border)",
          background: "var(--bf-bg2)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="bf-section-label" style={{ marginBottom: 0 }}>
            Applicant Reviews
          </div>
          {batchId && (
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontWeight: 600,
                color: "var(--bf-text-dim)",
                background: "rgba(255,255,255,0.04)",
                padding: "2px 8px",
                borderRadius: "var(--bf-radius-pill)",
              }}
            >
              Batch
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Batch selector */}
          {batchListQuery.data && batchListQuery.data.items.length > 0 && (
            <select
              value={batchId ?? ""}
              onChange={(e) => {
                setBatchId(e.target.value || null);
                setSelectedApplicationId(null);
              }}
              style={{
                background: "var(--bf-surface)",
                border: "1px solid var(--bf-border)",
                borderRadius: "var(--bf-radius)",
                padding: "6px 10px",
                fontSize: 12,
                color: "var(--bf-text-secondary)",
                fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                cursor: "pointer",
              }}
            >
              {batchListQuery.data.items.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.imported_count}) — {b.status}
                </option>
              ))}
            </select>
          )}
          {/* Rubric selector */}
          {rubricListQuery.data && rubricListQuery.data.items.length > 0 && (
            <select
              value={selectedRubricDocId ?? ""}
              onChange={(e) => {
                setSelectedRubricDocId(e.target.value || null);
                setSelectedApplicationId(null);
              }}
              style={{
                background: "var(--bf-surface)",
                border: "1px solid var(--bf-border)",
                borderRadius: "var(--bf-radius)",
                padding: "6px 10px",
                fontSize: 12,
                color: "var(--bf-text-secondary)",
                fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                cursor: "pointer",
              }}
            >
              {rubricListQuery.data.items.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.is_active ? "(active)" : ""}
                </option>
              ))}
            </select>
          )}
          <button
            className="bf-btn-primary"
            style={{ fontSize: 12, padding: "6px 14px" }}
            onClick={() => setCreateModalOpen(true)}
          >
            New Batch
          </button>
          {applications.length > 0 && (
            <>
              <button
                className="bf-btn-primary"
                style={{ fontSize: 12, padding: "6px 14px" }}
                onClick={handleReevaluateAll}
                disabled={applicationActions.isReevaluating}
              >
                {applicationActions.isReevaluating ? "Evaluating..." : "Rescore All"}
              </button>
              {batchId && (
                <button
                  className="bf-btn-primary"
                  style={{ fontSize: 12, padding: "6px 14px", opacity: 0.8 }}
                  onClick={() => batchProgress.open(batchId)}
                >
                  Progress
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main layout: sidebar + content — both panels scroll independently */}
      <div style={{ display: "flex", height: "calc(100vh - 120px)", overflow: "hidden" }}>
        {/* Left sidebar: ranked cards */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            borderRight: "1px solid var(--bf-border)",
            background: "var(--bf-bg)",
            display: "flex",
            flexDirection: "column" as const,
          }}
        >
          {/* Search + sort */}
          <div
            style={{
              padding: "12px 12px 8px",
              borderBottom: "1px solid var(--bf-border)",
            }}
          >
            <input
              type="text"
              placeholder="Search applicants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bf-surface)",
                border: "1px solid var(--bf-border)",
                borderRadius: "var(--bf-radius)",
                padding: "7px 10px",
                fontSize: 12,
                color: "var(--bf-text)",
                fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                outline: "none",
              }}
            />
            <div className="flex items-center gap-1" style={{ marginTop: 6 }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  fontSize: 11,
                  color: "var(--bf-text-dim)",
                  fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="score">Sort: Score</option>
                <option value="confidence">Sort: Confidence</option>
                <option value="name">Sort: Name</option>
                <option value="updated_at">Sort: Updated</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 11,
                  color: "var(--bf-text-dim)",
                  cursor: "pointer",
                  padding: "2px 6px",
                }}
              >
                {sortOrder === "desc" ? "\u2193" : "\u2191"}
              </button>
            </div>
          </div>

          {/* Card list */}
          <div
            ref={cardListRef}
            onScroll={handleCardListScroll}
            style={{
              flex: 1,
              overflowY: "auto" as const,
              padding: "8px 8px",
            }}
            className="space-y-1"
          >
            {visibleApps.map((app, idx) => (
              <ApplicantCard
                key={app.id}
                applicant={app}
                rank={idx + 1}
                isSelected={selectedApplicationId === app.id}
                onClick={() =>
                  setSelectedApplicationId(
                    selectedApplicationId === app.id ? null : app.id,
                  )
                }
              />
            ))}
            {filteredApps.length === 0 && applications.length > 0 && (
              <div
                style={{
                  padding: "20px 12px",
                  textAlign: "center" as const,
                  fontSize: 13,
                  color: "var(--bf-text-dim)",
                  fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                }}
              >
                No matches for &ldquo;{searchQuery}&rdquo;
              </div>
            )}
            {applications.length === 0 && (
              <div
                style={{
                  padding: "40px 12px",
                  textAlign: "center" as const,
                  fontSize: 13,
                  color: "var(--bf-text-dim)",
                  fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                }}
              >
                No applicants yet.
                <br />
                Import a batch to get started.
              </div>
            )}
          </div>

          {/* Card count */}
          {applications.length > 0 && (
            <div
              style={{
                padding: "8px 12px",
                borderTop: "1px solid var(--bf-border)",
                fontSize: 11,
                color: "var(--bf-text-dim)",
                fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                textAlign: "center" as const,
              }}
            >
              {filteredApps.length} of {applications.length} applicants
            </div>
          )}
        </div>

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto" as const,
            padding: "24px",
            background: "var(--bf-bg)",
          }}
        >
          {selectedApplicationId && detailQuery.data ? (
            <ApplicantProfile
              detail={detailQuery.data}
              isLoading={detailQuery.isLoading}
            />
          ) : selectedApplicationId && detailQuery.isLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 300,
                color: "var(--bf-text-dim)",
                fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                fontSize: 14,
              }}
            >
              Loading profile...
            </div>
          ) : (
            <BatchOverview
              applicants={applications}
              rubric={structuredRubricQuery.data}
              batchName={batchId ? `Batch ${batchId.slice(-6)}` : undefined}
              onSelectApplicant={setSelectedApplicationId}
            />
          )}
        </div>
      </div>

      {/* Batch graph (post-review) */}
      {batchProgress.batch?.status === "completed" && batchProgress.batch?.review_bonfire_id && (
        <div className="mt-4 rounded-lg border border-dark-s-700 overflow-hidden" style={{ height: 400 }}>
          <ReviewGraphPanel
            bonfireId={batchProgress.batch.review_bonfire_id}
            className="h-full"
          />
        </div>
      )}

      {/* Modals */}
      <BatchCreationModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        bonfireId={bonfireId}
        onBatchCreated={async (newBatchId) => {
          setBatchId(newBatchId);
          setCreateModalOpen(false);
          await refreshData();
        }}
      />
      <BatchProgressModal
        isOpen={batchProgress.isOpen}
        onClose={batchProgress.close}
        batch={batchProgress.batch}
        reevaluateProgress={applicationActions.reevaluateProgress}
        onReevaluateAll={
          batchId && applications.length > 0
            ? () => handleReevaluateAll()
            : undefined
        }
        streamState={applicationActions.streamState}
        onCancel={applicationActions.cancelStream}
        reviewBonfireId={batchProgress.batch?.review_bonfire_id ?? undefined}
        dispatchGraphExpand={applicationActions.dispatchGraphExpand}
      />
    </div>
  );
}
