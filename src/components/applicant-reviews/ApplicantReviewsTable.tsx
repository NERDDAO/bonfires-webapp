"use client";

import type { ApplicantReviewListItem } from "@/types/applicant-reviews";

interface ApplicantReviewsTableProps {
  applications: ApplicantReviewListItem[];
  selectedApplicationId: string | null;
  onSelectApplication: (id: string) => void;
  actionIds: Record<string, boolean>;
  onShortlistToggle: (app: ApplicantReviewListItem) => void;
  onRetryResearch: (app: ApplicantReviewListItem) => void;
  onRescore: (app: ApplicantReviewListItem) => void;
  onDelete?: (app: ApplicantReviewListItem) => void;
  showOrgColumn?: boolean;
}

export function ApplicantReviewsTable({
  applications,
  selectedApplicationId,
  onSelectApplication,
  actionIds,
  onShortlistToggle,
  onRetryResearch,
  onRescore,
  onDelete,
  showOrgColumn,
}: ApplicantReviewsTableProps) {
  return (
    <div className="bf-table-wrap">
      <table className="bf-table">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Rank</th>
            {showOrgColumn && <th>Org</th>}
            <th>Score</th>
            <th>Confidence</th>
            <th>Status</th>
            <th>Shortlist</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr
              key={application.id}
              className={`cursor-pointer ${selectedApplicationId === application.id ? "selected" : ""}`}
              onClick={() => onSelectApplication(application.id)}
            >
              <td>
                <span className="bf-name">{application.full_name}</span>
                <span className="bf-role">
                  {application.role_title || "Role not provided"}
                </span>
              </td>
              <td>
                {application.slot_rank != null ? (
                  <span className="bf-rank-cell">#{application.slot_rank}</span>
                ) : (
                  <span className="text-base-content/40">&mdash;</span>
                )}
              </td>
              {showOrgColumn && (
                <td className="truncate" style={{ maxWidth: 150, color: 'var(--bf-text-secondary)' }}>
                  {application.organizations?.join(", ") || "\u2014"}
                </td>
              )}
              <td><span className="bf-score">{application.overall_score?.toFixed(1) ?? "—"}</span></td>
              <td>
                {application.confidence_score !== null &&
                application.confidence_score !== undefined
                  ? `${Math.round(application.confidence_score * 100)}%`
                  : "—"}
              </td>
              <td>
                <div className="bf-status">
                  <div>{application.research_status}</div>
                  <div>{application.evaluation_status}</div>
                </div>
              </td>
              <td>{application.shortlist_status}</td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="bf-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShortlistToggle(application);
                    }}
                    disabled={!!actionIds[application.id]}
                  >
                    {application.shortlist_status === "shortlisted"
                      ? "Unshortlist"
                      : "Shortlist"}
                  </button>
                  <button
                    className="bf-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetryResearch(application);
                    }}
                    disabled={!!actionIds[application.id]}
                  >
                    Retry
                  </button>
                  <button
                    className="bf-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRescore(application);
                    }}
                    disabled={!!actionIds[application.id]}
                  >
                    Re-score
                  </button>
                  {onDelete && (
                    <button
                      className="bf-action-btn danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(application);
                      }}
                      disabled={!!actionIds[application.id]}
                      title="Delete submission"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
