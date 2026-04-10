"use client";

import type { ApplicantReviewDetailResponse } from "@/types/applicant-reviews";
import { CategoryScoreCard } from "./CategoryScoreCard";

interface ApplicantProfileProps {
  detail: ApplicantReviewDetailResponse;
  isLoading?: boolean;
}

function IdentityLink({ label, value, url }: { label: string; value?: string | null; url?: string | null }) {
  if (!value) return null;
  const content = (
    <span
      style={{
        fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
        fontSize: 13,
        color: url ? "var(--bf-ember)" : "var(--bf-text-secondary)",
        textDecoration: url ? "underline" : "none",
        textDecorationColor: "rgba(245, 87, 42, 0.3)",
        textUnderlineOffset: 2,
      }}
    >
      {value}
    </span>
  );

  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          color: "var(--bf-text-dim)",
          width: 60,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

export function ApplicantProfile({ detail, isLoading }: ApplicantProfileProps) {
  const app = detail.application;
  const review = detail.review;
  const identity = detail.identity;

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        style={{
          background: "var(--bf-surface)",
          border: "1px solid var(--bf-border)",
          borderRadius: "var(--bf-radius)",
          padding: "24px",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div
              style={{
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: "var(--bf-text)",
                lineHeight: 1.2,
              }}
            >
              {app.full_name}
            </div>
            {(app.role_title || app.organizations?.length > 0) && (
              <div
                style={{
                  fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                  fontSize: 14,
                  color: "var(--bf-text-secondary)",
                  marginTop: 4,
                }}
              >
                {[app.role_title, app.organizations?.join(", ")].filter(Boolean).join(" \u00b7 ")}
              </div>
            )}
          </div>

          {/* Score block */}
          {review && (
            <div className="text-right flex-shrink-0" style={{ marginLeft: 24 }}>
              <div
                style={{
                  fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                  fontWeight: 800,
                  fontSize: 36,
                  color: "var(--bf-text)",
                  lineHeight: 1,
                }}
              >
                {review.weighted_score.toFixed(1)}
              </div>
              <div className="flex items-center gap-2 justify-end" style={{ marginTop: 6 }}>
                {review.recommendation === "top25_candidate" && (
                  <span
                    style={{
                      fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase" as const,
                      color: "var(--bf-ember)",
                      background: "var(--bf-ember-dim)",
                      padding: "3px 8px",
                      borderRadius: "var(--bf-radius-pill)",
                    }}
                  >
                    Top 25
                  </span>
                )}
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                    fontSize: 12,
                    color: "var(--bf-text-dim)",
                  }}
                >
                  {Math.round(review.confidence_score * 100)}% confidence
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Identity links */}
        <div className="flex flex-wrap gap-x-6 gap-y-1" style={{ marginTop: 16 }}>
          <IdentityLink
            label="ETH"
            value={identity?.ethereum_address ? `${identity.ethereum_address.slice(0, 6)}...${identity.ethereum_address.slice(-4)}` : app.ethereum_address ? `${app.ethereum_address.slice(0, 6)}...${app.ethereum_address.slice(-4)}` : null}
          />
          <IdentityLink
            label="GitHub"
            value={identity?.github_handle ?? app.github_profile_url?.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
            url={identity?.github_url ?? app.github_profile_url}
          />
          <IdentityLink
            label="Twitter"
            value={identity?.twitter_handle ? `@${identity.twitter_handle}` : app.twitter_handle ? `@${app.twitter_handle}` : null}
            url={identity?.twitter_url}
          />
          <IdentityLink
            label="Telegram"
            value={identity?.telegram_handle ? `@${identity.telegram_handle}` : null}
            url={identity?.telegram_url}
          />
        </div>
      </div>

      {/* Bio */}
      {review?.bio && (
        <div
          style={{
            background: "var(--bf-surface)",
            border: "1px solid var(--bf-border)",
            borderRadius: "var(--bf-radius)",
            padding: "20px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "var(--bf-ember)",
              marginBottom: 10,
            }}
          >
            Bio
          </div>
          <div
            style={{
              fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--bf-text-secondary)",
            }}
          >
            {review.bio}
          </div>
        </div>
      )}

      {/* Category scores */}
      {review && review.category_scores.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "var(--bf-ember)",
              marginBottom: 10,
            }}
          >
            Category Scores
          </div>
          <div className="space-y-2">
            {review.category_scores
              .sort((a, b) => b.score - a.score)
              .map((cat) => (
                <CategoryScoreCard key={cat.name} category={cat} />
              ))}
          </div>
        </div>
      )}

      {/* Strengths & Concerns */}
      {review && (review.strengths.length > 0 || review.concerns.length > 0) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
            borderRadius: "var(--bf-radius)",
            overflow: "hidden",
          }}
        >
          <div style={{ background: "var(--bf-surface)", padding: "20px" }}>
            <div
              style={{
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: "var(--bf-text-secondary)",
                marginBottom: 10,
              }}
            >
              Strengths
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {review.strengths.map((s, i) => (
                <li
                  key={i}
                  style={{
                    fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "var(--bf-text-secondary)",
                    padding: "4px 0",
                    paddingLeft: 12,
                    position: "relative" as const,
                  }}
                >
                  <span
                    style={{
                      position: "absolute" as const,
                      left: 0,
                      color: "var(--bf-ember)",
                    }}
                  >
                    +
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: "var(--bf-surface)", padding: "20px" }}>
            <div
              style={{
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: "var(--bf-text-secondary)",
                marginBottom: 10,
              }}
            >
              Concerns
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {review.concerns.map((c, i) => (
                <li
                  key={i}
                  style={{
                    fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "var(--bf-text-secondary)",
                    padding: "4px 0",
                    paddingLeft: 12,
                    position: "relative" as const,
                  }}
                >
                  <span
                    style={{
                      position: "absolute" as const,
                      left: 0,
                      color: "var(--bf-text-dim)",
                    }}
                  >
                    -
                  </span>
                  {c}
                </li>
              ))}
              {review.concerns.length === 0 && (
                <li
                  style={{
                    fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                    fontSize: 13,
                    color: "var(--bf-text-dim)",
                  }}
                >
                  None identified
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Rationale */}
      {review?.rationale && (
        <div
          style={{
            background: "var(--bf-surface)",
            border: "1px solid var(--bf-border)",
            borderRadius: "var(--bf-radius)",
            padding: "20px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "var(--bf-text-secondary)",
              marginBottom: 10,
            }}
          >
            Rationale
          </div>
          <div
            style={{
              fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
              fontSize: 13,
              lineHeight: 1.65,
              color: "var(--bf-text-secondary)",
            }}
          >
            {review.rationale}
          </div>
        </div>
      )}

      {/* Evidence links */}
      {app.public_evidence_links && app.public_evidence_links.length > 0 && (
        <div
          style={{
            background: "var(--bf-surface)",
            border: "1px solid var(--bf-border)",
            borderRadius: "var(--bf-radius)",
            padding: "20px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "var(--bf-text-secondary)",
              marginBottom: 10,
            }}
          >
            Evidence ({app.public_evidence_links.length})
          </div>
          <div className="space-y-1">
            {app.public_evidence_links.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate"
                style={{
                  fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                  fontSize: 12,
                  color: "var(--bf-text-secondary)",
                  textDecoration: "none",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--bf-border)",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--bf-ember)"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--bf-text-secondary)"; }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* No review state */}
      {!review && (
        <div
          style={{
            background: "var(--bf-surface)",
            border: "1px solid var(--bf-border)",
            borderRadius: "var(--bf-radius)",
            padding: "40px 20px",
            textAlign: "center" as const,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
              fontSize: 14,
              color: "var(--bf-text-dim)",
            }}
          >
            This applicant has not been evaluated yet.
          </div>
        </div>
      )}
    </div>
  );
}
