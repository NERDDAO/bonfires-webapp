/**
 * TaxonomyLabelsPanel Component
 *
 * Panel displaying taxonomy labels with counts and labeling controls.
 */
"use client";

import { useCallback, useState } from "react";

import type { TaxonomyLabel } from "@/types";

/**
 * TaxonomyLabelsPanel Component
 *
 * Panel displaying taxonomy labels with counts and labeling controls.
 */

interface TaxonomyLabelsPanelProps {
  /** Available taxonomy labels */
  labels: TaxonomyLabel[];
  /** Currently selected label for filtering */
  selectedLabel?: string | null;
  /** Callback when label is selected/deselected */
  onLabelSelect?: (label: string | null) => void;
  /** Callback to trigger labeling process */
  onTriggerLabeling?: () => Promise<void>;
  /** Whether labeling is in progress */
  isLabeling?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Generate a color class based on label name (deterministic)
 */
function getLabelColor(name: string): string {
  const colors = [
    "badge-primary",
    "badge-secondary",
    "badge-accent",
    "badge-info",
    "badge-success",
    "badge-warning",
  ] as const;
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length] ?? "badge-primary";
}

export function TaxonomyLabelsPanel({
  labels,
  selectedLabel,
  onLabelSelect,
  onTriggerLabeling,
  isLabeling = false,
  isLoading = false,
  className = "",
}: TaxonomyLabelsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleLabelClick = useCallback(
    (labelName: string) => {
      if (selectedLabel === labelName) {
        onLabelSelect?.(null);
      } else {
        onLabelSelect?.(labelName);
      }
    },
    [selectedLabel, onLabelSelect]
  );

  const handleTriggerLabeling = useCallback(async () => {
    if (onTriggerLabeling) {
      await onTriggerLabeling();
    }
  }, [onTriggerLabeling]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`card bg-base-200 ${className}`}>
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-8 w-24 rounded-lg" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-6 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalLabeledChunks = labels.reduce(
    (acc, label) => acc + label.count,
    0
  );

  return (
    <div className={`card bg-base-200 ${className}`}>
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            className="flex items-center gap-2 text-sm font-semibold text-base-content/80 hover:text-base-content"
            onClick={() => setIsExpanded(!isExpanded)}
          >
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
            <span>Taxonomy Labels</span>
            <span className="badge badge-sm badge-ghost">{labels.length}</span>
          </button>

          {/* Trigger labeling button */}
          {onTriggerLabeling && (
            <button
              className={`btn btn-sm btn-primary ${isLabeling ? "loading" : ""}`}
              onClick={handleTriggerLabeling}
              disabled={isLabeling}
            >
              {isLabeling ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Labeling...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  Label Chunks
                </>
              )}
            </button>
          )}
        </div>

        {/* Labels list */}
        {isExpanded && (
          <div className="space-y-3">
            {labels.length === 0 ? (
              <p className="text-sm text-base-content/50 py-2">
                No taxonomy labels available. Trigger labeling to categorize
                chunks.
              </p>
            ) : (
              <>
                {/* Clear filter button */}
                {selectedLabel && (
                  <button
                    className="btn btn-xs btn-ghost gap-1"
                    onClick={() => onLabelSelect?.(null)}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Clear filter
                  </button>
                )}

                {/* Labels */}
                <div className="space-y-2">
                  {labels.map((label) => {
                    const isSelected = selectedLabel === label.name;
                    const colorClass = label.color ?? getLabelColor(label.name);

                    return (
                      <button
                        key={label.name}
                        className={`
                          w-full flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-all
                          ${isSelected ? `${colorClass} ring-2 ring-offset-2 ring-primary` : "border-base-300 hover:bg-base-300/50"}
                        `}
                        onClick={() => handleLabelClick(label.name)}
                        title={label.name}
                      >
                        <span className="flex-1 whitespace-normal break-words leading-snug">
                          {label.name}
                        </span>
                        <span className="badge badge-ghost badge-sm shrink-0">
                          {label.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="pt-2 border-t border-base-300 mt-3">
                  <div className="flex items-center justify-between text-xs text-base-content/50">
                    <span>{totalLabeledChunks} total labeled chunks</span>
                    <span>{labels.length} categories</span>
                  </div>
                  {totalLabeledChunks === 0 && (
                    <p className="mt-2 text-xs text-base-content/50">
                      No chunks labeled yet. Run labeling to populate counts.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for taxonomy panel
 */
export function TaxonomyLabelsPanelSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return <TaxonomyLabelsPanel labels={[]} isLoading className={className} />;
}
