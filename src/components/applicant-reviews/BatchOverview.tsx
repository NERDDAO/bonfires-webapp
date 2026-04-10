"use client";

import { useMemo } from "react";

import type { ApplicantReviewListItem, StructuredRubricResponse } from "@/types/applicant-reviews";

interface BatchOverviewProps {
  applicants: ApplicantReviewListItem[];
  rubric?: StructuredRubricResponse | null;
  batchName?: string;
  onSelectApplicant?: (id: string) => void;
}

const SCORE_BRACKETS = [
  { label: "90+", min: 90, max: 101, color: "var(--bf-ember)" },
  { label: "80-89", min: 80, max: 90, color: "rgba(245, 87, 42, 0.7)" },
  { label: "70-79", min: 70, max: 80, color: "rgba(245, 87, 42, 0.45)" },
  { label: "60-69", min: 60, max: 70, color: "var(--bf-text-secondary)" },
  { label: "50-59", min: 50, max: 60, color: "var(--bf-text-dim)" },
  { label: "<50", min: 0, max: 50, color: "rgba(255,255,255,0.08)" },
] as const;

function StatCell({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{ background: "var(--bf-surface)", padding: "20px 16px", textAlign: "center" }}>
      <div
        style={{
          fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
          fontWeight: 800,
          fontSize: 28,
          color: accent ? "var(--bf-ember)" : "var(--bf-text)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
          fontSize: 12,
          color: "var(--bf-text-secondary)",
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function SectionLabel({ children, ember }: { children: React.ReactNode; ember?: boolean }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: ember ? "var(--bf-ember)" : "var(--bf-text-secondary)",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

export function BatchOverview({ applicants, rubric, batchName, onSelectApplicant }: BatchOverviewProps) {
  const stats = useMemo(() => {
    const evaluated = applicants.filter((a) => a.overall_score != null);
    const scores = evaluated.map((a) => a.overall_score ?? 0).sort((a, b) => b - a);
    const top25 = applicants.filter((a) => a.recommendation === "top25_candidate").length;
    const avg = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
    const median = scores.length > 0 ? scores[Math.floor(scores.length / 2)] : 0;
    const p90 = scores.length > 0 ? scores[Math.floor(scores.length * 0.1)] : 0;

    // Top 5
    const top5 = evaluated
      .sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0))
      .slice(0, 5);

    // Score distribution
    const distribution = SCORE_BRACKETS.map((bracket) => ({
      ...bracket,
      count: evaluated.filter((a) => (a.overall_score ?? 0) >= bracket.min && (a.overall_score ?? 0) < bracket.max).length,
    }));
    const maxDistCount = Math.max(1, ...distribution.map((d) => d.count));

    // Org breakdown
    const orgMap = new Map<string, { count: number; totalScore: number; scored: number }>();
    for (const app of applicants) {
      const orgs = app.organizations?.length ? app.organizations : ["Unaffiliated"];
      for (const org of orgs) {
        const entry = orgMap.get(org) ?? { count: 0, totalScore: 0, scored: 0 };
        entry.count++;
        if (app.overall_score != null) {
          entry.totalScore += app.overall_score;
          entry.scored++;
        }
        orgMap.set(org, entry);
      }
    }
    const orgBreakdown = Array.from(orgMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgScore: data.scored > 0 ? data.totalScore / data.scored : null,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const maxOrgCount = Math.max(1, ...orgBreakdown.map((o) => o.count));

    return {
      total: applicants.length,
      evaluated: evaluated.length,
      pending: applicants.length - evaluated.length,
      top25,
      avg,
      median,
      p90,
      top5,
      distribution,
      maxDistCount,
      orgBreakdown,
      maxOrgCount,
    };
  }, [applicants]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div
          style={{
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--bf-ember)",
            marginBottom: 8,
          }}
        >
          Batch Overview
        </div>
        {batchName && (
          <div
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: 19,
              color: "var(--bf-text)",
            }}
          >
            {batchName}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 2,
          borderRadius: "var(--bf-radius)",
          overflow: "hidden",
        }}
      >
        <StatCell label="Total" value={stats.total} />
        <StatCell label="Evaluated" value={stats.evaluated} />
        <StatCell label="Top 25" value={stats.top25} accent />
        <StatCell label="Avg Score" value={stats.avg > 0 ? stats.avg.toFixed(1) : "--"} />
        <StatCell label="Median" value={stats.median && stats.median > 0 ? stats.median.toFixed(1) : "--"} />
      </div>

      {/* Two-column: distribution + top 5 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, borderRadius: "var(--bf-radius)", overflow: "hidden" }}>
        {/* Score distribution */}
        {stats.evaluated > 0 && (
          <div style={{ background: "var(--bf-surface)", padding: "20px" }}>
            <SectionLabel>Score Distribution</SectionLabel>
            <div className="space-y-2">
              {stats.distribution.map((bracket) => (
                <div key={bracket.label} className="flex items-center gap-3">
                  <span
                    style={{
                      width: 40,
                      fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--bf-text-dim)",
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {bracket.label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 16,
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(bracket.count / stats.maxDistCount) * 100}%`,
                        background: bracket.color,
                        borderRadius: 3,
                        transition: "width 0.4s ease",
                        minWidth: bracket.count > 0 ? 4 : 0,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      width: 20,
                      fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                      color: bracket.count > 0 ? "var(--bf-text)" : "var(--bf-text-dim)",
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {bracket.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top 5 leaderboard */}
        {stats.top5.length > 0 && (
          <div style={{ background: "var(--bf-surface)", padding: "20px" }}>
            <SectionLabel ember>Top 5</SectionLabel>
            <div className="space-y-1">
              {stats.top5.map((app, idx) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => onSelectApplicant?.(app.id)}
                  className="w-full text-left"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    background: "transparent",
                    border: "none",
                    borderRadius: "var(--bf-radius)",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bf-surface2)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                      fontWeight: 800,
                      fontSize: 14,
                      color: idx === 0 ? "var(--bf-ember)" : "var(--bf-text-dim)",
                      width: 20,
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="truncate"
                      style={{
                        fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--bf-text)",
                      }}
                    >
                      {app.full_name}
                    </div>
                    {app.organizations?.length > 0 && (
                      <div
                        className="truncate"
                        style={{ fontSize: 11, color: "var(--bf-text-dim)" }}
                      >
                        {app.organizations.join(", ")}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                      fontWeight: 800,
                      fontSize: 16,
                      color: "var(--bf-text)",
                      flexShrink: 0,
                    }}
                  >
                    {app.overall_score?.toFixed(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Two-column: org breakdown + evidence coverage */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, borderRadius: "var(--bf-radius)", overflow: "hidden" }}>
        {/* Org breakdown */}
        <div style={{ background: "var(--bf-surface)", padding: "20px" }}>
          <SectionLabel>Organizations</SectionLabel>
          <div className="space-y-1.5">
            {stats.orgBreakdown.map((org) => (
              <div key={org.name} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="truncate"
                      style={{
                        fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                        fontSize: 12,
                        color: "var(--bf-text)",
                        maxWidth: 120,
                      }}
                    >
                      {org.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--bf-text-dim)",
                        flexShrink: 0,
                      }}
                    >
                      {org.count}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 3,
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 2,
                      marginTop: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(org.count / stats.maxOrgCount) * 100}%`,
                        background: org.avgScore != null && org.avgScore >= 80
                          ? "var(--bf-ember)"
                          : "var(--bf-text-secondary)",
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
                {org.avgScore != null && (
                  <span
                    style={{
                      fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--bf-text-dim)",
                      flexShrink: 0,
                      width: 30,
                      textAlign: "right",
                    }}
                  >
                    {org.avgScore.toFixed(0)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Evidence coverage + rubric */}
        <div style={{ background: "var(--bf-surface)", padding: "20px" }}>
          <SectionLabel>Recommendations</SectionLabel>
          <div className="space-y-2" style={{ marginBottom: 20 }}>
            {[
              { label: "Top 25", count: stats.top25, color: "var(--bf-ember)" },
              { label: "Standard", count: stats.evaluated - stats.top25, color: "var(--bf-text-secondary)" },
              { label: "Pending", count: stats.pending, color: "rgba(255,255,255,0.08)" },
            ].map((bucket) => (
              <div key={bucket.label} className="flex items-center gap-3">
                <span
                  style={{
                    width: 64,
                    fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                    fontSize: 11,
                    color: "var(--bf-text-dim)",
                    flexShrink: 0,
                  }}
                >
                  {bucket.label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 14,
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: stats.total > 0 ? `${(bucket.count / stats.total) * 100}%` : "0",
                      background: bucket.color,
                      borderRadius: 3,
                      minWidth: bucket.count > 0 ? 4 : 0,
                    }}
                  />
                </div>
                <span
                  style={{
                    width: 20,
                    fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: bucket.count > 0 ? "var(--bf-text)" : "var(--bf-text-dim)",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {bucket.count}
                </span>
              </div>
            ))}
          </div>

          {/* Rubric categories */}
          {rubric && rubric.categories && rubric.categories.length > 0 && (
            <>
              <SectionLabel>Rubric Criteria</SectionLabel>
              <div className="space-y-1">
                {rubric.categories.map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between"
                    style={{ padding: "5px 0", borderBottom: "1px solid var(--bf-border)" }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                        fontSize: 12,
                        color: "var(--bf-text-secondary)",
                      }}
                    >
                      {cat.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--bf-text-dim)",
                      }}
                    >
                      {Math.round(cat.weight * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pending notice */}
      {stats.pending > 0 && (
        <div
          style={{
            fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
            fontSize: 13,
            color: "var(--bf-text-dim)",
            textAlign: "center",
            padding: "8px 0",
          }}
        >
          {stats.pending} applicant{stats.pending !== 1 ? "s" : ""} pending evaluation
        </div>
      )}
    </div>
  );
}
