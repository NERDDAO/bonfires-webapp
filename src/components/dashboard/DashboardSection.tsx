/**
 * DashboardSection Component
 *
 * Wrapper component for dashboard sections with independent loading states.
 * Shows skeleton loader while loading, error state with retry, or content.
 */
"use client";

import { type ReactNode } from "react";

/**
 * DashboardSection Component
 *
 * Wrapper component for dashboard sections with independent loading states.
 * Shows skeleton loader while loading, error state with retry, or content.
 */

interface DashboardSectionProps {
  /** Section title */
  title: string;
  /** Section icon (emoji or component) */
  icon?: ReactNode;
  /** Whether the section is loading */
  isLoading: boolean;
  /** Whether the section has an error */
  isError: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Section content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Number of skeleton rows to show */
  skeletonRows?: number;
  /** Optional action button in header */
  headerAction?: ReactNode;
  /** Whether to show empty state */
  isEmpty?: boolean;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * Skeleton loader for dashboard sections
 */
function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-base-300 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-base-300 rounded w-3/4" />
            <div className="h-3 bg-base-300 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Error state for dashboard sections
 */
function SectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="text-error text-4xl mb-2">⚠️</div>
      <p className="text-error text-sm mb-3">{message}</p>
      {onRetry && (
        <button className="btn btn-sm btn-outline btn-error" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Empty state for dashboard sections
 */
function SectionEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="text-base-content/50 text-4xl mb-2">📭</div>
      <p className="text-base-content/70 text-sm">{message}</p>
    </div>
  );
}

export function DashboardSection({
  title,
  icon,
  isLoading,
  isError,
  errorMessage = "Failed to load this section",
  onRetry,
  children,
  className = "",
  skeletonRows = 3,
  headerAction,
  isEmpty = false,
  emptyMessage = "No items to display",
}: DashboardSectionProps) {
  return (
    <div className={`card bg-base-200 shadow-lg ${className}`}>
      <div className="card-body">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title text-lg">
            {icon && <span className="mr-2">{icon}</span>}
            {title}
          </h2>
          {headerAction}
        </div>

        {/* Content */}
        {isLoading ? (
          <SectionSkeleton rows={skeletonRows} />
        ) : isError ? (
          <SectionError message={errorMessage} onRetry={onRetry} />
        ) : isEmpty ? (
          <SectionEmpty message={emptyMessage} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export { SectionSkeleton, SectionError, SectionEmpty };
