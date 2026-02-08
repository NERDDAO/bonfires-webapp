/**
 * DocumentsTable Component
 *
 * Table displaying documents with expandable chunk preview.
 * Supports copying document IDs and viewing chunk details.
 */
"use client";

import { useCallback, useState } from "react";

import type { DocumentChunk } from "@/types";

/**
 * DocumentsTable Component
 *
 * Table displaying documents with expandable chunk preview.
 * Supports copying document IDs and viewing chunk details.
 */

interface DocumentRow {
  uuid?: string;
  name?: string;
  content: string;
  category?: string;
  index: number;
  document_id?: string;
  labels?: string[];
  created_at?: string;
}

interface DocumentsTableProps {
  /** Document chunks to display */
  chunks: DocumentChunk[];
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface ExpandableRowProps {
  chunk: DocumentRow;
  isExpanded: boolean;
  onToggle: () => void;
  onCopyId: (id: string) => void;
}

/**
 * Format date for display
 */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

/**
 * Truncate text for preview
 */
function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function ExpandableRow({
  chunk,
  isExpanded,
  onToggle,
  onCopyId,
}: ExpandableRowProps) {
  const [copied, setCopied] = useState(false);
  const chunkUuid = chunk.uuid ?? "";
  const canCopyUuid = chunkUuid.length > 0;
  const shortUuid = chunkUuid ? `${chunkUuid.slice(0, 8)}...` : "—";

  const handleCopy = useCallback(() => {
    if (!chunkUuid) return;
    navigator.clipboard.writeText(chunkUuid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopyId(chunkUuid);
  }, [chunkUuid, onCopyId]);

  return (
    <>
      {/* Main row */}
      <tr className="hover cursor-pointer" onClick={onToggle}>
        <td className="w-12">
          <button className="btn btn-ghost btn-xs btn-circle">
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </td>
        <td className="max-w-xs">
          <div className="font-mono text-xs text-base-content/60">
            {shortUuid}
          </div>
        </td>
        <td className="max-w-md">
          <div className="text-sm line-clamp-2">
            {truncateText(chunk.content, 150)}
          </div>
        </td>
        <td>
          {chunk.category ? (
            <span className="badge badge-outline badge-sm">
              {chunk.category}
            </span>
          ) : (
            <span className="text-base-content/40">—</span>
          )}
        </td>
        <td>
          <span className="font-mono text-sm">{chunk.index}</span>
        </td>
        <td className="text-xs text-base-content/60">
          {formatDate(chunk.created_at)}
        </td>
        <td>
          <button
            className={`btn btn-ghost btn-xs ${copied ? "text-success" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (canCopyUuid) {
                handleCopy();
              }
            }}
            title={canCopyUuid ? "Copy Document ID" : "No ID to copy"}
            disabled={!canCopyUuid}
          >
            {copied ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            )}
          </button>
        </td>
      </tr>

      {/* Expanded content */}
      {isExpanded && (
        <tr className="bg-base-200/50">
          <td colSpan={7} className="p-4">
            <div className="space-y-3">
              {/* Full content */}
              <div>
                <p className="text-sm font-semibold text-base-content/60 mb-2">
                  Content
                </p>
                <div className="bg-base-300 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {chunk.content}
                </div>
              </div>

              {/* Labels */}
              {chunk.labels && chunk.labels.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-base-content/60 mb-2">
                    Labels
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {chunk.labels.map((label) => (
                      <span
                        key={label}
                        className="badge badge-primary badge-sm"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex gap-6 text-xs text-base-content/60">
                <div>
                  <span className="font-semibold">UUID:</span>{" "}
                  <code className="font-mono">{chunkUuid || "—"}</code>
                </div>
                {chunk.document_id && (
                  <div>
                    <span className="font-semibold">Document ID:</span>{" "}
                    <code className="font-mono">{chunk.document_id}</code>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function DocumentsTable({
  chunks,
  isLoading = false,
  className = "",
}: DocumentsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = useCallback((uuid: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  }, []);

  const handleCopyId = useCallback((id: string) => {
    // Could show a toast notification here
    console.log("Copied ID:", id);
  }, []);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="table">
          <thead>
            <tr>
              <th className="w-12"></th>
              <th>ID</th>
              <th>Content</th>
              <th>Category</th>
              <th>Index</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td>
                  <div className="skeleton w-6 h-6 rounded-full" />
                </td>
                <td>
                  <div className="skeleton h-4 w-20" />
                </td>
                <td>
                  <div className="skeleton h-4 w-48" />
                </td>
                <td>
                  <div className="skeleton h-5 w-16 rounded-full" />
                </td>
                <td>
                  <div className="skeleton h-4 w-8" />
                </td>
                <td>
                  <div className="skeleton h-4 w-24" />
                </td>
                <td>
                  <div className="skeleton w-6 h-6" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (chunks.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <svg
          className="w-16 h-16 mx-auto text-base-content/20 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-base-content/60 mb-2">
          No documents yet
        </h3>
        <p className="text-base-content/40">
          Upload your first document to get started
        </p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="table">
        <thead>
          <tr>
            <th className="w-12"></th>
            <th>ID</th>
            <th>Content</th>
            <th>Category</th>
            <th>Index</th>
            <th>Created</th>
            <th className="w-12"></th>
          </tr>
        </thead>
        <tbody>
          {chunks.map((chunk) => {
            const rowId =
              chunk.uuid ?? `${chunk.document_id ?? "chunk"}-${chunk.index}`;
            return (
              <ExpandableRow
                key={rowId}
                chunk={chunk}
                isExpanded={expandedRows.has(rowId)}
                onToggle={() => toggleRow(rowId)}
                onCopyId={handleCopyId}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Skeleton loader for documents table
 */
export function DocumentsTableSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return <DocumentsTable chunks={[]} isLoading className={className} />;
}
