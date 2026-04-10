"use client";

import type { ApplicantReviewListItem } from "@/types/applicant-reviews";

interface ApplicantCardProps {
  applicant: ApplicantReviewListItem;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
}

export function ApplicantCard({ applicant, rank, isSelected, onClick }: ApplicantCardProps) {
  const score = applicant.overall_score;
  const rec = applicant.recommendation;
  const isTop25 = rec === "top25_candidate";
  const org = applicant.organizations?.join(", ") || "";

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full text-left transition-colors duration-200"
      style={{
        background: isSelected ? "var(--bf-surface2)" : "var(--bf-surface)",
        border: `1px solid ${isSelected ? "var(--bf-ember)" : "var(--bf-border)"}`,
        borderRadius: "var(--bf-radius)",
        padding: "12px 14px",
        cursor: "pointer",
        outline: "none",
      }}
    >
      {/* Ember top bar on selected */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "var(--bf-ember)",
            borderRadius: "var(--bf-radius) var(--bf-radius) 0 0",
          }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Rank */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--bf-radius)",
            background: isTop25 ? "var(--bf-ember-dim)" : "rgba(255,255,255,0.04)",
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: isTop25 ? "var(--bf-ember)" : "var(--bf-text-dim)",
          }}
        >
          #{rank}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div
            className="truncate"
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: "var(--bf-text)",
              lineHeight: 1.3,
            }}
          >
            {applicant.full_name}
          </div>
          {org && (
            <div
              className="truncate"
              style={{
                fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                fontSize: 12,
                color: "var(--bf-text-secondary)",
                marginTop: 2,
              }}
            >
              {org}
            </div>
          )}
        </div>

        {/* Score */}
        <div className="flex-shrink-0 text-right">
          <div
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: score != null ? "var(--bf-text)" : "var(--bf-text-dim)",
              lineHeight: 1,
            }}
          >
            {score != null ? score.toFixed(1) : "--"}
          </div>
          {isTop25 && (
            <div
              style={{
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontWeight: 600,
                fontSize: 9,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: "var(--bf-ember)",
                marginTop: 3,
              }}
            >
              top 25
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
