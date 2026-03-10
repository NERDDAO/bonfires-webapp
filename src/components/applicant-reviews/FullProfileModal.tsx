"use client";

import { Modal } from "@/components/ui/modal";
import type { ApplicantReviewDetailResponse } from "@/types/applicant-reviews";

interface FullProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: ApplicantReviewDetailResponse | undefined;
}

function EvidenceItem({ item }: { item: Record<string, unknown> }) {
  const kind = (item.kind as string) ?? "unknown";
  const url = (item.url as string) ?? "";
  const status = (item.status as string) ?? "";
  const snippet =
    (item.extracted_text as string) ?? (item.snippet as string) ?? "";
  const isFailed = String(status).toLowerCase() === "failed";

  return (
    <div className="rounded-lg bg-dark-s-800 p-3 space-y-1">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <span className="text-sm font-medium text-dark-s-0">
          {(item.label as string) ?? kind}
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

export function FullProfileModal({
  isOpen,
  onClose,
  detail,
}: FullProfileModalProps) {
  const app = detail?.application;
  const identity = detail?.identity;
  const name = app?.full_name ?? identity?.full_name ?? "—";
  const role = app?.role_title ?? identity?.role_title ?? "";
  const orgs = app?.organizations?.length
    ? app.organizations.join(", ")
    : identity?.organizations?.join(", ") ?? "";

  const narratives = [
    { label: "Primary Contribution", value: app?.primary_contribution },
    { label: "Top Researcher Claim", value: app?.top_researcher_claim },
    { label: "Other Security Areas", value: app?.other_security_areas },
    { label: "Priority Issues", value: app?.priority_issues },
  ].filter((n) => n.value);

  const vouches = app?.vouches ?? [];
  const evidence = (app?.evidence ?? []) as Array<Record<string, unknown>>;

  const subtitle = [role, orgs].filter(Boolean).join(" · ") || "—";

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
        <section data-element-id="profile-identity">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-s-0 mb-2">
            Identity
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              {
                label: "Ethereum",
                value:
                  identity?.ethereum_address ?? app?.ethereum_address ?? "—",
              },
              {
                label: "GitHub",
                value: identity?.github_url ?? app?.github_profile_url ?? "—",
                link: identity?.github_url ?? app?.github_profile_url,
              },
              {
                label: "Twitter/X",
                value: identity?.twitter_url ?? app?.twitter_handle ?? "—",
                link: identity?.twitter_url,
              },
              {
                label: "Telegram",
                value: identity?.telegram_url ?? app?.telegram_handle ?? "—",
                link: identity?.telegram_url,
              },
            ].map(({ label, value, link }) => (
              <div key={label}>
                <div className="text-xs text-dark-s-200">{label}</div>
                <div className="text-dark-s-0 break-all">
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-dark-s-700" />

        {narratives.length > 0 && (
          <>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-s-0 mb-2">
                Narrative Answers
              </h3>
              <div className="space-y-3">
                {narratives.map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs font-semibold text-dark-s-200 mb-1">
                      {label}
                    </div>
                    <div className="rounded-lg bg-dark-s-800 p-3 text-sm leading-relaxed text-dark-s-100">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <hr className="border-dark-s-700" />
          </>
        )}

        {vouches.length > 0 && (
          <>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-dark-s-0 mb-2">
                Vouches
              </h3>
              <div className="flex flex-wrap gap-2">
                {vouches.map((v) => (
                  <span
                    key={v}
                    className="rounded border border-dark-s-600 px-2 py-1 text-xs text-dark-s-100 bg-dark-s-800"
                  >
                    {v}
                  </span>
                ))}
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
