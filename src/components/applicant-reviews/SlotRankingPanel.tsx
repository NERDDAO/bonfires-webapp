"use client";

import { useState } from "react";

import toast from "react-hot-toast";

import { apiClient } from "@/lib/api/client";
import type {
  ApplicantReviewListItem,
  FillSlotsResponse,
} from "@/types/applicant-reviews";

interface SlotRankingPanelProps {
  batchId: string;
  applications: ApplicantReviewListItem[];
  onSlotsAssigned: () => void;
}

export function SlotRankingPanel({
  batchId,
  applications: _applications,
  onSlotsAssigned,
}: SlotRankingPanelProps) {
  const [totalSlots, setTotalSlots] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FillSlotsResponse | null>(null);

  const handleFillSlots = async () => {
    if (totalSlots < 1) {
      toast.error("Total slots must be at least 1.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post<FillSlotsResponse>(
        `/api/applicant-review-batches/${batchId}/fill-slots`,
        { total_slots: totalSlots },
      );
      setResults(response);
      toast.success(
        `Slots filled: ${response.ranked.filter((r) => r.shortlist_status === "shortlisted").length} shortlisted`,
      );
      onSlotsAssigned();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fill slots",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const shortlisted = results?.ranked.filter(
    (r) => r.shortlist_status === "shortlisted",
  );
  const rejected = results?.ranked.filter(
    (r) => r.shortlist_status !== "shortlisted",
  );
  const avgScore =
    shortlisted && shortlisted.length > 0
      ? shortlisted.reduce((sum, r) => sum + (r.overall_score ?? 0), 0) /
        shortlisted.length
      : 0;

  const maxScore =
    results?.ranked.reduce(
      (max, r) => Math.max(max, r.overall_score ?? 0),
      0,
    ) ?? 100;

  return (
    <div>
      <div className="bf-section-label">SLOT RANKING</div>
      <h3>Fill Available Slots</h3>

      <div className="bf-slot-controls">
        <label className="bf-label" style={{ marginBottom: 0 }}>
          Total slots
        </label>
        <input
          type="number"
          className="bf-input"
          min={1}
          value={totalSlots}
          onChange={(e) => setTotalSlots(Number(e.target.value))}
        />
        <button
          className="bf-btn-primary"
          onClick={() => void handleFillSlots()}
          disabled={isLoading}
        >
          {isLoading ? "Filling..." : "Fill Slots"}
        </button>
      </div>

      {results && (
        <>
          <div className="bf-slot-grid">
            {shortlisted?.map((item, i) => (
              <div
                key={item.application_id}
                className="bf-slot-card bf-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="bf-slot-rank">#{item.slot_rank}</div>
                <div style={{ fontWeight: 400 }}>{item.full_name}</div>
                <div className="bf-score-bar">
                  <div
                    className="bf-score-bar-fill"
                    style={{
                      width: `${((item.overall_score ?? 0) / maxScore) * 100}%`,
                    }}
                  />
                </div>
                <div className="bf-score-value">
                  {item.overall_score?.toFixed(1) ?? "—"}
                </div>
                <span className="bf-badge-ember">SHORTLISTED</span>
              </div>
            ))}
          </div>

          {rejected && rejected.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  margin: "16px 0",
                }}
              >
                <div className="bf-ember-line" />
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-dim)",
                    fontWeight: 500,
                  }}
                >
                  Below cutoff
                </span>
              </div>

              <div className="bf-slot-grid">
                {rejected.map((item, i) => (
                  <div
                    key={item.application_id}
                    className="bf-slot-card bf-fade-up"
                    style={{
                      animationDelay: `${(shortlisted?.length ?? 0 + i) * 0.05}s`,
                    }}
                  >
                    <div className="bf-slot-rank dim">
                      #{item.slot_rank ?? "—"}
                    </div>
                    <div style={{ fontWeight: 400 }}>{item.full_name}</div>
                    <div className="bf-score-bar">
                      <div
                        className="bf-score-bar-fill dim"
                        style={{
                          width: `${((item.overall_score ?? 0) / maxScore) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="bf-score-value">
                      {item.overall_score?.toFixed(1) ?? "—"}
                    </div>
                    <span className="bf-badge-dim">REJECTED</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="bf-stat-row">
            <div>
              <div className="bf-stat-number">{shortlisted?.length ?? 0}</div>
              <div className="bf-stat-label">Shortlisted</div>
            </div>
            <div>
              <div className="bf-stat-number">{rejected?.length ?? 0}</div>
              <div className="bf-stat-label">Rejected</div>
            </div>
            <div>
              <div className="bf-stat-number">{avgScore.toFixed(1)}</div>
              <div className="bf-stat-label">Avg Score (shortlisted)</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
