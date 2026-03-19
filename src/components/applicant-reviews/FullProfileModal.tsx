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
        background: "var(--bf-surface2)",
        border: "1px solid var(--bf-border)",
        borderRadius: "var(--bf-radius)",
        padding: 12,
      }}
      className="space-y-1"
    >
      <div className="flex justify-between items-center flex-wrap gap-2">
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--bf-text)",
          }}
        >
          {(item["label"] as string) ?? kind}
        </span>
        <div className="flex gap-2">
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
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 12,
            color: "var(--bf-ember)",
            wordBreak: "break-all",
          }}
          className="hover:underline block"
        >
          {url}
        </a>
      )}
      {snippet && (
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.6,
            color: isFailed ? "#ef4444" : "var(--bf-text-secondary)",
          }}
        >
          {snippet}
        </p>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="bf-section-label" style={{ marginBottom: 8 }}>
      {children}
    </h3>
  );
}

function FieldCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bf-surface2)",
        border: "1px solid var(--bf-border)",
        borderRadius: "var(--bf-radius)",
        padding: 12,
        fontSize: 14,
        lineHeight: 1.6,
        color: "var(--bf-text-secondary)",
      }}
    >
      {children}
    </div>
  );
}

function IdentitySection({ section }: { section: DisplaySection }) {
  return (
    <section>
      <SectionHeading>{section.label}</SectionHeading>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2" style={{ fontSize: 14 }}>
        {section.fields.map((field) => (
          <div key={field.key}>
            <div style={{ fontSize: 12, color: "var(--bf-text-dim)" }}>
              {field.label}
            </div>
            <div style={{ color: "var(--bf-text)", wordBreak: "break-all" }}>
              <DisplayFieldValue field={field} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NarrativeSection({ section }: { section: DisplaySection }) {
  return (
    <section>
      <SectionHeading>{section.label}</SectionHeading>
      <div className="space-y-3">
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
            <FieldCard>
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
      <div className="space-y-1" style={{ fontSize: 14 }}>
        {section.fields.map((field) => (
          <div key={field.key} className="flex gap-2">
            <span style={{ color: "var(--bf-text-secondary)", fontWeight: 500 }}>
              {field.label}:
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

function NormalizedFieldsFallback({ fields }: { fields: Record<string, unknown> }) {
  const SKIP = new Set([
    "full_name", "organizations", "role_title", "submitted_at_raw",
    "submitted_at", "token", "validation_errors", "public_evidence_links",
  ]);

  const entries = Object.entries(fields).filter(
    ([key, val]) => !SKIP.has(key) && val != null && String(val).trim() !== "",
  );

  if (entries.length === 0) return null;

  return (
    <section>
      <SectionHeading>Application Fields</SectionHeading>
      <div className="space-y-3">
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
              {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </div>
            <FieldCard>
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
    : detail?.identity?.organizations?.join(", ") ?? "";

  const sections = detail?.display_sections ?? [];
  const evidence = (app?.evidence ?? []) as Array<Record<string, unknown>>;
  const subtitle = [role, orgs].filter(Boolean).join(" · ") || "—";

  const hasSections = sections.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={name}
      description={subtitle}
      size="xl"
      showCloseButton
      className="max-w-[640px] max-h-[85vh] overflow-y-auto"
    >
      <div className="space-y-5" style={{ paddingTop: 8 }}>
        {hasSections ? (
          sections.map((section, i) => (
            <div key={section.key}>
              <SectionRenderer section={section} />
              {i < sections.length - 1 && (
                <div className="bf-ember-line" style={{ marginTop: 20 }} />
              )}
            </div>
          ))
        ) : (
          app?.normalized_fields && (
            <NormalizedFieldsFallback fields={app.normalized_fields} />
          )
        )}

        {hasSections && <div className="bf-ember-line" />}

        {detail?.review != null && (
          <>
            <section>
              <SectionHeading>Generated Bio</SectionHeading>
              <FieldCard>
                {detail.review.bio || "No generated bio for this review."}
              </FieldCard>
            </section>
            <div className="bf-ember-line" />
          </>
        )}

        {evidence.length > 0 && (
          <section>
            <SectionHeading>
              Evidence ({evidence.length} items)
            </SectionHeading>
            <div className="space-y-2">
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
