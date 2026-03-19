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
    <div className="overflow-x-auto">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Applicant</th>
            {showOrgColumn && <th>Org</th>}
            <th>Score</th>
            <th>Confidence</th>
            <th>Status</th>
            <th>Shortlist</th>
            <th className={onDelete ? "w-48" : "w-40"}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr
              key={application.id}
              className={`cursor-pointer hover ${
                selectedApplicationId === application.id ? "bg-base-200" : ""
              }`}
              onClick={() => onSelectApplication(application.id)}
            >
              <td>
                <div className="font-medium">{application.full_name}</div>
                <div className="text-xs text-base-content/60">
                  {application.role_title || "Role not provided"}
                </div>
              </td>
              {showOrgColumn && (
                <td className="text-sm text-base-content/70 truncate max-w-[150px]">
                  {application.organizations?.join(", ") || "\u2014"}
                </td>
              )}
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
                    className="btn btn-ghost btn-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetryResearch(application);
                    }}
                    disabled={!!actionIds[application.id]}
                  >
                    Retry
                  </button>
                  <button
                    className="btn btn-ghost btn-xs"
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
                      className="btn btn-ghost btn-xs text-error"
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
