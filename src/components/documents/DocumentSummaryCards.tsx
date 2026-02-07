/**
 * DocumentSummaryCards Component
 *
 * Summary statistics cards showing document and chunk counts.
 */
"use client";

import type { DocumentSummary } from "@/types";

/**
 * DocumentSummaryCards Component
 *
 * Summary statistics cards showing document and chunk counts.
 */

interface DocumentSummaryCardsProps {
  /** Summary data */
  summary: DocumentSummary | null;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

function SummaryCard({
  title,
  value,
  icon,
  color,
  isLoading,
}: SummaryCardProps) {
  return (
    <div className="card bg-base-200">
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-base-content/60">
              {title}
            </h3>
            {isLoading ? (
              <div className="skeleton h-7 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-base-content">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentSummaryCards({
  summary,
  isLoading = false,
  className = "",
}: DocumentSummaryCardsProps) {
  const cards = [
    {
      title: "Total Documents",
      value: summary?.total_documents ?? 0,
      icon: (
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: "bg-primary/10",
    },
    {
      title: "Total Chunks",
      value: summary?.total_chunks ?? 0,
      icon: (
        <svg
          className="w-5 h-5 text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      color: "bg-secondary/10",
    },
    {
      title: "Labeled Chunks",
      value: summary?.labeled_chunks ?? 0,
      icon: (
        <svg
          className="w-5 h-5 text-success"
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
      ),
      color: "bg-success/10",
    },
    {
      title: "Unlabeled Chunks",
      value: summary?.unlabeled_chunks ?? 0,
      icon: (
        <svg
          className="w-5 h-5 text-warning"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-warning/10",
    },
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {cards.map((card) => (
        <SummaryCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton loader for summary cards
 */
export function DocumentSummaryCardsSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card bg-base-200">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="skeleton w-9 h-9 rounded-lg" />
              <div className="flex-1">
                <div className="skeleton h-4 w-20 mb-2" />
                <div className="skeleton h-7 w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
