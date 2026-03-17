"use client";

import type {
  ApplicantReviewDetailResponse,
  DisplaySection,
} from "@/types/applicant-reviews";
import { DisplayFieldValue } from "./DisplayField";

interface ApplicantDetailSidebarProps {
  selectedApplicationId: string | null;
  detail: ApplicantReviewDetailResponse | undefined;
  isLoading: boolean;
  selectedRubricId: string | null;
  rubricName?: string;
  actionIds: Record<string, boolean>;
  onEvaluate: (applicationId: string) => void;
  onViewFullProfile: () => void;
}

export function ApplicantDetailSidebar({
  selectedApplicationId,
  detail,
  isLoading,
  selectedRubricId,
  rubricName,
  actionIds,
  onEvaluate,
  onViewFullProfile,
}: ApplicantDetailSidebarProps) {
  const selectedApplication = detail?.application;
  const selectedReview = detail?.review;
  const selectedIdentity = detail?.identity;

  if (!selectedApplicationId) {
    return (
      <div className="text-sm text-base-content/60">
        Select an applicant to inspect their normalized profile, evidence, and
        rubric breakdown.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-base-content/60">
        Loading applicant detail...
      </div>
    );
  }

  if (!selectedApplication) {
    return (
      <div className="text-sm text-base-content/60">
        Unable to load applicant detail.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          {selectedApplication.full_name}
        </h2>
        <p className="text-sm text-base-content/70">
          {selectedApplication.role_title || "Role not provided"}
        </p>
      </div>

      <IdentitySection detail={detail} />

      {!selectedReview && selectedRubricId && (
        <div className="rounded-xl border border-dashed border-base-300 p-4 text-center space-y-3">
          <p className="text-sm text-base-content/60">
            Not yet evaluated with this rubric.
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onEvaluate(selectedApplicationId);
            }}
            disabled={!!actionIds[selectedApplicationId]}
          >
            Evaluate with {rubricName ?? "this rubric"}
          </button>
        </div>
      )}

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
            onClick={() => onViewFullProfile()}
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
              <h4 className="text-xs font-semibold text-success">Strengths</h4>
              <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                {selectedReview.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {selectedReview.concerns.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-warning">Concerns</h4>
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
            <li className="text-base-content/60">No public links listed.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function IdentitySection({
  detail,
}: {
  detail: ApplicantReviewDetailResponse | undefined;
}) {
  const application = detail?.application;
  const identity = detail?.identity;

  // Try structured display_sections first (richer rendering)
  const identitySection = (detail?.display_sections ?? []).find(
    (s: DisplaySection) => s.kind === "identity",
  );
  if (identitySection && identitySection.fields.length > 0) {
    return (
      <div className="space-y-1 text-sm">
        {identitySection.fields.map((field) => (
          <div key={field.key}>
            <span className="font-medium">{field.label}:</span>{" "}
            <DisplayFieldValue field={field} />
          </div>
        ))}
      </div>
    );
  }

  // Fallback to hardcoded fields
  return (
    <div className="space-y-1 text-sm">
      <div>
        <span className="font-medium">Ethereum:</span>{" "}
        {identity?.ethereum_address || application?.ethereum_address || "—"}
      </div>
      <div>
        <span className="font-medium">GitHub:</span>{" "}
        {identity?.github_url || application?.github_profile_url || "—"}
      </div>
      <div>
        <span className="font-medium">Twitter/X:</span>{" "}
        {identity?.twitter_url || application?.twitter_handle || "—"}
      </div>
      <div>
        <span className="font-medium">Telegram:</span>{" "}
        {identity?.telegram_url || "—"}
      </div>
    </div>
  );
}
