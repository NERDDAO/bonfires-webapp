"use client";

import type { DisplayField } from "@/types/applicant-reviews";

export function DisplayFieldValue({ field }: { field: DisplayField }) {
  const val = field.value;

  switch (field.format) {
    case "url": {
      const href = typeof val === "string" ? val : "";
      if (!href) return <span className="text-dark-s-200">—</span>;
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline break-all"
        >
          {href}
        </a>
      );
    }

    case "handle": {
      const handle = typeof val === "string" ? val : "";
      if (!handle) return <span className="text-dark-s-200">—</span>;
      const display = handle.startsWith("@") ? handle : `@${handle}`;
      if (field.resolved_url) {
        return (
          <a
            href={field.resolved_url}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            {display}
          </a>
        );
      }
      return <span>{display}</span>;
    }

    case "address": {
      const addr = typeof val === "string" ? val : "";
      return <span className="font-mono text-xs break-all">{addr || "—"}</span>;
    }

    case "tags": {
      const tags = Array.isArray(val)
        ? (val as string[])
        : typeof val === "string"
          ? val.split(",").map((t) => t.trim()).filter(Boolean)
          : [];
      if (tags.length === 0) return <span className="text-dark-s-200">—</span>;
      return (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-dark-s-600 px-2 py-1 text-xs text-dark-s-100 bg-dark-s-800"
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
