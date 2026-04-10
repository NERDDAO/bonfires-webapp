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
  onEvaluate?: (applicationId: string) => void;
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
      <div style={{ fontSize: 14, color: 'var(--bf-text-dim)' }}>
        Select an applicant to inspect their normalized profile, evidence, and
        rubric breakdown.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ fontSize: 14, color: 'var(--bf-text-dim)' }}>
        Loading applicant detail...
      </div>
    );
  }

  if (!selectedApplication) {
    return (
      <div style={{ fontSize: 14, color: 'var(--bf-text-dim)' }}>
        Unable to load applicant detail.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--bf-text)' }}>
          {selectedApplication.full_name}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--bf-text-secondary)' }}>
          {selectedApplication.role_title || "Role not provided"}
        </p>
      </div>

      <IdentitySection detail={detail} />

      {!selectedReview && selectedRubricId && (
        <div className="space-y-3" style={{ background: 'var(--bf-surface)', border: '1px dashed var(--bf-border-bright)', borderRadius: 'var(--bf-radius)', padding: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--bf-text-dim)' }}>
            Not yet evaluated with this rubric.
          </p>
          {onEvaluate && (
            <button
              className="bf-btn-primary"
              style={{ fontSize: 13, padding: '8px 16px' }}
              onClick={(e) => {
                e.stopPropagation();
                onEvaluate(selectedApplicationId);
              }}
              disabled={!!actionIds[selectedApplicationId]}
            >
              Evaluate with {rubricName ?? "this rubric"}
            </button>
          )}
        </div>
      )}

      {selectedReview && (
        <div className="space-y-3" style={{ background: 'var(--bf-surface)', border: '1px solid var(--bf-border)', borderRadius: 'var(--bf-radius)', padding: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--bf-text)' }}>
              Score {selectedReview.weighted_score.toFixed(1)} / 100
            </div>
            <div style={{ fontSize: 12, color: 'var(--bf-text-secondary)' }}>
              {selectedReview.recommendation} · confidence{" "}
              {Math.round(selectedReview.confidence_score * 100)}%
            </div>
          </div>

          <button
            type="button"
            className="bf-btn-secondary"
            style={{ width: '100%', fontSize: 13, padding: '8px 16px', borderColor: 'var(--bf-ember)', color: 'var(--bf-ember)' }}
            onClick={() => onViewFullProfile()}
            data-element-id="view-full-profile"
          >
            View Full Profile
          </button>

          <div>
            <h4 className="bf-section-label" style={{ marginBottom: 4 }}>Bio</h4>
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
                <div className="bf-score-bar" style={{ marginTop: 4 }}>
                  <div className="bf-score-bar-fill" style={{ width: `${category.score}%` }} />
                </div>
                {category.reasoning && (
                  <p className="mt-0.5" style={{ fontSize: 12, color: 'var(--bf-text-secondary)' }}>
                    {category.reasoning}
                  </p>
                )}
              </div>
            ))}
          </div>

          {selectedReview.strengths.length > 0 && (
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>Strengths</h4>
              <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                {selectedReview.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {selectedReview.concerns.length > 0 && (
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--bf-ember)' }}>Concerns</h4>
              <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                {selectedReview.concerns.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {selectedReview.comparative_reasoning && (
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--bf-text-secondary)' }}>
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
        <h3 className="bf-section-label" style={{ marginBottom: 8 }}>Evidence Links</h3>
        <ul className="space-y-1 text-sm">
          {selectedApplication.public_evidence_links?.length ? (
            selectedApplication.public_evidence_links.map((link) => (
              <li key={link} style={{ wordBreak: 'break-all', color: 'var(--bf-ember)' }}>
                <a href={link} target="_blank" rel="noreferrer">
                  {link}
                </a>
              </li>
            ))
          ) : (
            <li style={{ color: 'var(--bf-text-dim)' }}>No public links listed.</li>
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
            <span style={{ fontWeight: 500, color: 'var(--bf-text-secondary)' }}>{field.label}:</span>{" "}
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
        <span style={{ fontWeight: 500, color: 'var(--bf-text-secondary)' }}>Ethereum:</span>{" "}
        {identity?.ethereum_address || application?.ethereum_address || "—"}
      </div>
      <div>
        <span style={{ fontWeight: 500, color: 'var(--bf-text-secondary)' }}>GitHub:</span>{" "}
        {identity?.github_url || application?.github_profile_url || "—"}
      </div>
      <div>
        <span style={{ fontWeight: 500, color: 'var(--bf-text-secondary)' }}>Twitter/X:</span>{" "}
        {identity?.twitter_url || application?.twitter_handle || "—"}
      </div>
      <div>
        <span style={{ fontWeight: 500, color: 'var(--bf-text-secondary)' }}>Telegram:</span>{" "}
        {identity?.telegram_url || "—"}
      </div>
    </div>
  );
}
