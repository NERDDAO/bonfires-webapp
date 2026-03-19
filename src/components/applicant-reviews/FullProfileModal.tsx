"use client";

import { Modal } from "@/components/ui/modal";
import { DisplayFieldValue } from "@/components/applicant-reviews/DisplayField";
import type {
  ApplicantReviewDetailResponse,
  DisplaySection,
} from "@/types/applicant-reviews";

interface FullProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: ApplicantReviewDetailResponse | undefined;
}

/* ── Shared sub-components ── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="bf-section-label" style={{ marginBottom: 12 }}>
      {children}
    </h3>
  );
}

function FieldCard({
  children,
  compact,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--bf-surface2)",
        border: "1px solid var(--bf-border)",
        borderRadius: "var(--bf-radius)",
        padding: compact ? "8px 12px" : 12,
        fontSize: 14,
        lineHeight: 1.6,
        color: "var(--bf-text-secondary)",
      }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: "var(--bf-border)",
        margin: "20px 0",
      }}
    />
  );
}

/* ── Profile Header ── */

function ProfileHeader({
  name,
  subtitle,
  review,
}: {
  name: string;
  subtitle: string;
  review?: ApplicantReviewDetailResponse["review"];
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        paddingBottom: 16,
        borderBottom: "1px solid var(--bf-border)",
        marginBottom: 20,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2
          style={{
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontSize: 24,
            fontWeight: 800,
            color: "var(--bf-text)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}
        >
          {name}
        </h2>
        <p style={{ fontSize: 14, color: "var(--bf-text-secondary)" }}>
          {subtitle}
        </p>
      </div>

      {review && (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: "var(--bf-text)",
              lineHeight: 1,
            }}
          >
            {review.weighted_score.toFixed(1)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--bf-text-secondary)",
              marginTop: 2,
            }}
          >
            {review.recommendation} · {Math.round(review.confidence_score * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Section renderers ── */

function IdentitySection({ section }: { section: DisplaySection }) {
  return (
    <section>
      <SectionHeading>{section.label}</SectionHeading>
      <div
        style={{
          background: "var(--bf-surface2)",
          border: "1px solid var(--bf-border)",
          borderRadius: "var(--bf-radius)",
          padding: 16,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 24px",
            fontSize: 14,
          }}
        >
          {section.fields.map((field) => (
            <div key={field.key}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--bf-text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 2,
                }}
              >
                {field.label}
              </div>
              <div style={{ color: "var(--bf-text)", wordBreak: "break-all" }}>
                <DisplayFieldValue field={field} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NarrativeSection({ section }: { section: DisplaySection }) {
  return (
    <section>
      <SectionHeading>{section.label}</SectionHeading>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {section.fields.map((field) => (
          <div key={field.key}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--bf-text-secondary)",
                marginBottom: 4,
              }}
            >
              {field.label}
            </div>
            <FieldCard compact>
              <DisplayFieldValue field={field} />
            </FieldCard>
          </div>
        ))}
      </div>
    </section>
  );
}

function TagsSection({ section }: { section: DisplaySection }) {
  return (
    <section>
      <SectionHeading>{section.label}</SectionHeading>
      {section.fields.map((field) => (
        <DisplayFieldValue key={field.key} field={field} />
      ))}
    </section>
  );
}

function MetaSection({ section }: { section: DisplaySection }) {
  return (
    <section>
      <SectionHeading>{section.label}</SectionHeading>
      <div
        style={{
          background: "var(--bf-surface2)",
          border: "1px solid var(--bf-border)",
          borderRadius: "var(--bf-radius)",
          padding: 12,
          fontSize: 13,
        }}
      >
        {section.fields.map((field, i) => (
          <div
            key={field.key}
            style={{
              display: "flex",
              gap: 8,
              padding: "6px 0",
              borderTop: i > 0 ? "1px solid var(--bf-border)" : undefined,
            }}
          >
            <span
              style={{
                color: "var(--bf-text-dim)",
                fontWeight: 500,
                minWidth: 100,
                flexShrink: 0,
              }}
            >
              {field.label}
            </span>
            <span style={{ color: "var(--bf-text)" }}>
              <DisplayFieldValue field={field} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionRenderer({ section }: { section: DisplaySection }) {
  switch (section.kind) {
    case "identity":
      return <IdentitySection section={section} />;
    case "narrative":
      return <NarrativeSection section={section} />;
    case "tags":
      return <TagsSection section={section} />;
    case "meta":
      return <MetaSection section={section} />;
  }
}

/* ── Category score bars (from review) ── */

function CategoryScores({
  review,
}: {
  review: NonNullable<ApplicantReviewDetailResponse["review"]>;
}) {
  return (
    <section>
      <SectionHeading>Score Breakdown</SectionHeading>
      <div
        style={{
          background: "var(--bf-surface2)",
          border: "1px solid var(--bf-border)",
          borderRadius: "var(--bf-radius)",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {review.category_scores.map((cat) => (
            <div key={cat.name}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 500, color: "var(--bf-text)" }}>
                  {cat.name}
                </span>
                <span
                  style={{
                    fontFamily:
                      "var(--font-montserrat), Montserrat, sans-serif",
                    fontWeight: 700,
                    color: "var(--bf-text)",
                  }}
                >
                  {cat.score}
                </span>
              </div>
              <div className="bf-score-bar">
                <div
                  className="bf-score-bar-fill"
                  style={{ width: `${cat.score}%` }}
                />
              </div>
              {cat.reasoning && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--bf-text-dim)",
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {cat.reasoning}
                </p>
              )}
            </div>
          ))}
        </div>

        {(review.strengths.length > 0 || review.concerns.length > 0) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--bf-border)",
            }}
          >
            {review.strengths.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#4ade80",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  Strengths
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    fontSize: 12,
                    color: "var(--bf-text-secondary)",
                  }}
                >
                  {review.strengths.map((s, i) => (
                    <li
                      key={i}
                      style={{
                        paddingLeft: 12,
                        position: "relative",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "#4ade80",
                          fontWeight: 700,
                        }}
                      >
                        +
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {review.concerns.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--bf-ember)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  Concerns
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    fontSize: 12,
                    color: "var(--bf-text-secondary)",
                  }}
                >
                  {review.concerns.map((c, i) => (
                    <li
                      key={i}
                      style={{
                        paddingLeft: 12,
                        position: "relative",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "var(--bf-ember)",
                          fontWeight: 700,
                        }}
                      >
                        -
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Evidence ── */

function EvidenceItem({ item }: { item: Record<string, unknown> }) {
  const kind = (item["kind"] as string) ?? "unknown";
  const url = (item["url"] as string) ?? "";
  const status = (item["status"] as string) ?? "";
  const snippet =
    (item["extracted_text"] as string) ?? (item["snippet"] as string) ?? "";
  const isFailed = String(status).toLowerCase() === "failed";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 8,
        padding: "10px 12px",
        borderBottom: "1px solid var(--bf-border)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--bf-text)",
            marginBottom: 2,
          }}
        >
          {(item["label"] as string) ?? kind}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 12,
              color: "var(--bf-ember)",
              wordBreak: "break-all",
              display: "block",
            }}
            className="hover:underline"
          >
            {url}
          </a>
        )}
        {snippet && (
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: isFailed ? "#ef4444" : "var(--bf-text-dim)",
              marginTop: 4,
            }}
          >
            {snippet.length > 200 ? snippet.slice(0, 200) + "..." : snippet}
          </p>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
        }}
      >
        <span className="bf-badge-ember" style={{ fontSize: 10 }}>
          {kind}
        </span>
        <span
          style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: "var(--bf-radius-pill)",
            background: isFailed
              ? "rgba(239, 68, 68, 0.15)"
              : "rgba(74, 222, 128, 0.1)",
            color: isFailed ? "#ef4444" : "#4ade80",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            fontWeight: 500,
          }}
        >
          {status || "—"}
        </span>
      </div>
    </div>
  );
}

/* ── Fallback for older backends without display_sections ── */

function NormalizedFieldsFallback({
  fields,
}: {
  fields: Record<string, unknown>;
}) {
  const SKIP = new Set([
    "full_name",
    "organizations",
    "role_title",
    "submitted_at_raw",
    "submitted_at",
    "token",
    "validation_errors",
    "public_evidence_links",
  ]);

  const entries = Object.entries(fields).filter(
    ([key, val]) =>
      !SKIP.has(key) && val != null && String(val).trim() !== "",
  );

  if (entries.length === 0) return null;

  return (
    <section>
      <SectionHeading>Application Fields</SectionHeading>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {entries.map(([key, val]) => (
          <div key={key}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--bf-text-secondary)",
                marginBottom: 4,
              }}
            >
              {key
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </div>
            <FieldCard compact>
              {typeof val === "string"
                ? val
                : Array.isArray(val)
                  ? val.join(", ")
                  : JSON.stringify(val)}
            </FieldCard>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Main Modal ── */

export function FullProfileModal({
  isOpen,
  onClose,
  detail,
}: FullProfileModalProps) {
  const app = detail?.application;
  const name = app?.full_name ?? detail?.identity?.full_name ?? "—";
  const role = app?.role_title ?? detail?.identity?.role_title ?? "";
  const orgs = app?.organizations?.length
    ? app.organizations.join(", ")
    : (detail?.identity?.organizations?.join(", ") ?? "");

  const sections = detail?.display_sections ?? [];
  const evidence = (app?.evidence ?? []) as Array<Record<string, unknown>>;
  const subtitle = [role, orgs].filter(Boolean).join(" · ") || "—";
  const review = detail?.review;

  const hasSections = sections.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      showCloseButton
      className="max-w-[720px] max-h-[85vh] overflow-y-auto"
    >
      <ProfileHeader name={name} subtitle={subtitle} review={review} />

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {hasSections ? (
          sections.map((section) => (
            <SectionRenderer key={section.key} section={section} />
          ))
        ) : (
          app?.normalized_fields && (
            <NormalizedFieldsFallback fields={app.normalized_fields} />
          )
        )}

        {review && <CategoryScores review={review} />}

        {review?.bio && (
          <section>
            <SectionHeading>Generated Bio</SectionHeading>
            <FieldCard>{review.bio}</FieldCard>
          </section>
        )}

        {review?.comparative_reasoning && (
          <section>
            <SectionHeading>Comparative Analysis</SectionHeading>
            <FieldCard>{review.comparative_reasoning}</FieldCard>
          </section>
        )}

        {evidence.length > 0 && (
          <section>
            <SectionHeading>
              Evidence ({evidence.length})
            </SectionHeading>
            <div
              style={{
                background: "var(--bf-surface2)",
                border: "1px solid var(--bf-border)",
                borderRadius: "var(--bf-radius)",
                overflow: "hidden",
              }}
            >
              {evidence.map((item, i) => (
                <EvidenceItem key={i} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
