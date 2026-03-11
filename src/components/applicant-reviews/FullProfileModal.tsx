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
    <div className="rounded-lg bg-dark-s-800 p-3 space-y-1">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <span className="text-sm font-medium text-dark-s-0">
          {(item["label"] as string) ?? kind}
        </span>
        <div className="flex gap-2">
          <span className="rounded px-2 py-0.5 text-xs bg-dark-s-700 text-primary">
            {kind}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-xs ${
              isFailed ? "bg-red-950/50 text-red-400" : "bg-green-950/30 text-green-400"
            }`}
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
          className="text-xs text-primary break-all hover:underline"
        >
          {url}
        </a>
      )}
      {snippet && (
        <p
          className={`text-xs leading-relaxed ${
            isFailed ? "text-red-400" : "text-dark-s-200"
          }`}
        >
          {snippet}
        </p>
      )}
    </div>
  );
}

function IdentitySection({ section }: { section: DisplaySection }) {
  return (
    <section data-element-id="profile-identity">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-s-0 mb-2">
        {section.label}
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {section.fields.map((field) => (
          <div key={field.key}>
            <div className="text-xs text-dark-s-200">{field.label}</div>
            <div className="text-dark-s-0 break-all">
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
      <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-s-0 mb-2">
        {section.label}
      </h3>
      <div className="space-y-3">
        {section.fields.map((field) => (
          <div key={field.key}>
            <div className="text-xs font-semibold text-dark-s-200 mb-1">
              {field.label}
            </div>
            <div className="rounded-lg bg-dark-s-800 p-3 text-sm leading-relaxed text-dark-s-100">
              <DisplayFieldValue field={field} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TagsSection({ section }: { section: DisplaySection }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-s-0 mb-2">
        {section.label}
      </h3>
      {section.fields.map((field) => (
        <DisplayFieldValue key={field.key} field={field} />
      ))}
    </section>
  );
}

function MetaSection({ section }: { section: DisplaySection }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-s-0 mb-2">
        {section.label}
      </h3>
      <div className="space-y-1 text-sm">
        {section.fields.map((field) => (
          <div key={field.key} className="flex gap-2">
            <span className="text-dark-s-200 font-medium">{field.label}:</span>
            <span className="text-dark-s-100">
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

/**
 * Fallback: render normalized_fields as a simple dump when display_sections
 * is not available (e.g. older backend).
 */
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
      <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-s-0 mb-2">
        Application Fields
      </h3>
      <div className="space-y-3">
        {entries.map(([key, val]) => (
          <div key={key}>
            <div className="text-xs font-semibold text-dark-s-200 mb-1">
              {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </div>
            <div className="rounded-lg bg-dark-s-800 p-3 text-sm leading-relaxed text-dark-s-100">
              {typeof val === "string"
                ? val
                : Array.isArray(val)
                  ? val.join(", ")
                  : JSON.stringify(val)}
            </div>
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
      <div className="space-y-5 pt-2">
        {hasSections ? (
          sections.map((section, i) => (
            <div key={section.key}>
              <SectionRenderer section={section} />
              {i < sections.length - 1 && <hr className="border-dark-s-700 mt-5" />}
            </div>
          ))
        ) : (
          app?.normalized_fields && (
            <NormalizedFieldsFallback fields={app.normalized_fields} />
          )
        )}

        {hasSections && <hr className="border-dark-s-700" />}

        {detail?.review != null && (
          <>
            <section data-element-id="profile-generated-bio">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-s-0 mb-2">
                Generated bio
              </h3>
              <div className="rounded-lg bg-dark-s-800 p-3 text-sm leading-relaxed text-dark-s-100">
                {detail.review.bio || "No generated bio for this review."}
              </div>
            </section>
            <hr className="border-dark-s-700" />
          </>
        )}

        {evidence.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-s-0 mb-2">
              Evidence ({evidence.length} items)
            </h3>
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
