"use client";

import { useState } from "react";

import type { ApplicantCategoryScoreInfo } from "@/types/applicant-reviews";

interface CategoryScoreCardProps {
  category: ApplicantCategoryScoreInfo;
}

export function CategoryScoreCard({ category }: CategoryScoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.min(100, Math.max(0, category.score));
  const weightPct = Math.round(category.weight * 100);

  return (
    <div
      style={{
        background: "var(--bf-surface)",
        border: "1px solid var(--bf-border)",
        borderRadius: "var(--bf-radius)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
        style={{
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--bf-text)",
              }}
            >
              {category.name}
            </span>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                fontSize: 11,
                color: "var(--bf-text-dim)",
              }}
            >
              {weightPct}% weight
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: "var(--bf-text)",
              }}
            >
              {category.score}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--bf-text-dim)",
                transition: "transform 0.2s",
                transform: expanded ? "rotate(180deg)" : "rotate(0)",
                display: "inline-block",
              }}
            >
              &#9662;
            </span>
          </div>
        </div>

        {/* Score bar */}
        <div
          style={{
            height: 3,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: pct >= 80 ? "var(--bf-ember)" : pct >= 50 ? "var(--bf-text-secondary)" : "var(--bf-text-dim)",
              borderRadius: 2,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </button>

      {/* Reasoning (collapsible) */}
      {expanded && category.reasoning && (
        <div
          style={{
            padding: "0 16px 14px",
            fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--bf-text-secondary)",
            borderTop: "1px solid var(--bf-border)",
            paddingTop: 12,
            marginTop: 0,
          }}
        >
          {category.reasoning}
        </div>
      )}
    </div>
  );
}
