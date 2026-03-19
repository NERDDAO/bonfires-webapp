"use client";

import type { DisplayField } from "@/types/applicant-reviews";

export function DisplayFieldValue({ field }: { field: DisplayField }) {
  const val = field.value;

  switch (field.format) {
    case "url": {
      const href = typeof val === "string" ? val : "";
      if (!href) return <span style={{ color: "var(--bf-text-dim)" }}>—</span>;
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--bf-ember)", wordBreak: "break-all" }}
          className="hover:underline"
        >
          {href}
        </a>
      );
    }

    case "handle": {
      const handle = typeof val === "string" ? val : "";
      if (!handle) return <span style={{ color: "var(--bf-text-dim)" }}>—</span>;
      const display = handle.startsWith("@") ? handle : `@${handle}`;
      if (field.resolved_url) {
        return (
          <a
            href={field.resolved_url}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--bf-ember)" }}
            className="hover:underline"
          >
            {display}
          </a>
        );
      }
      return <span>{display}</span>;
    }

    case "address": {
      const addr = typeof val === "string" ? val : "";
      return (
        <span style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
          {addr || "—"}
        </span>
      );
    }

    case "tags": {
      const tags = Array.isArray(val)
        ? (val as string[])
        : typeof val === "string"
          ? val.split(",").map((t) => t.trim()).filter(Boolean)
          : [];
      if (tags.length === 0) return <span style={{ color: "var(--bf-text-dim)" }}>—</span>;
      return (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                border: "1px solid var(--bf-border-bright)",
                borderRadius: "var(--bf-radius)",
                padding: "2px 8px",
                fontSize: 12,
                color: "var(--bf-text-secondary)",
                background: "var(--bf-surface2)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      );
    }

    default: {
      const text = typeof val === "string" ? val : JSON.stringify(val);
      return <span>{text || "—"}</span>;
    }
  }
}
