/**
 * Timeline Component
 * Displays episode history in a horizontal timeline
 */
"use client";

import React, { useMemo } from "react";

import { SkeletonLoader } from "@/components/common";

import { cn } from "@/lib/cn";

/**
 * Timeline Component
 * Displays episode history in a horizontal timeline
 */

export interface EpisodeTimelineItem {
  uuid: string;
  name?: string;
  valid_at?: string;
  content?: string;
}

interface TimelineProps {
  /** Episodes to display in the timeline */
  episodes: EpisodeTimelineItem[];
  /** Currently selected episode ID */
  selectedEpisodeId: string | null;
  /** Callback when an episode is selected */
  onEpisodeSelect: (episodeUuid: string) => void;
  /** Whether the timeline is loading */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format an episode date for display
 */
function formatEpisodeDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Format date range for timeline header
 */
function formatDateRange(episodes: EpisodeTimelineItem[]): string | null {
  const dates = episodes
    .map((e) => e.valid_at)
    .filter((d): d is string => !!d)
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return null;

  const first = dates[0];
  const last = dates[dates.length - 1];

  if (!first || !last) return null;

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (first.toDateString() === last.toDateString()) {
    return formatDate(first);
  }

  return `${formatDate(first)} - ${formatDate(last)}`;
}

/**
 * Timeline - Episode history visualization
 */
export function Timeline({
  episodes,
  selectedEpisodeId,
  onEpisodeSelect,
  loading = false,
  className,
}: TimelineProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div
        className={cn(
          "bg-base-200 border-b border-base-300 px-4 py-3",
          className
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <SkeletonLoader width={120} height={16} />
          <SkeletonLoader width={100} height={14} />
        </div>
        <div className="h-0.5 bg-base-300 mb-3" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <SkeletonLoader width={12} height={12} radius="full" />
              <SkeletonLoader width={120} height={14} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sort episodes by date (ascending)
  const sortedEpisodes = useMemo(() => {
    return [...episodes].sort((a, b) => {
      const aTime = a.valid_at ? new Date(a.valid_at).getTime() : Infinity;
      const bTime = b.valid_at ? new Date(b.valid_at).getTime() : Infinity;
      return aTime - bTime;
    });
  }, [episodes]);

  const dateRange = useMemo(() => formatDateRange(episodes), [episodes]);

  // Empty state
  if (episodes.length === 0) {
    return (
      <div
        className={cn(
          "bg-base-200 border-b border-base-300 px-4 py-3",
          className
        )}
      >
        <div className="text-sm text-base-content/50 text-center">
          No episodes available
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-base-200 border-b border-base-300 px-4 py-3",
        className
      )}
      aria-label="Episode timeline"
      role="list"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-base-content">
          Timeline ({episodes.length} episode{episodes.length !== 1 ? "s" : ""})
        </div>
        {dateRange && (
          <div className="text-xs text-base-content/60">{dateRange}</div>
        )}
      </div>

      {/* Timeline axis */}
      <div className="h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 mb-3 rounded-full" />

      {/* Episodes */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-base-300">
        {sortedEpisodes.map((episode) => {
          const isSelected = episode.uuid === selectedEpisodeId;
          const label = episode.name || episode.uuid.slice(0, 8);
          const timestamp = formatEpisodeDate(episode.valid_at);

          return (
            <button
              key={episode.uuid}
              onClick={() => onEpisodeSelect(episode.uuid)}
              role="listitem"
              aria-pressed={isSelected}
              aria-label={`${label}${timestamp ? `, ${timestamp}` : ""}`}
              title={`${label}${timestamp ? ` • ${timestamp}` : ""}${episode.content ? `\n${episode.content}` : ""}`}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0",
                "text-sm transition-all duration-200",
                "hover:bg-base-300 focus:outline-none focus:ring-2 focus:ring-primary/50",
                isSelected
                  ? "bg-primary text-primary-content"
                  : "bg-base-100 text-base-content"
              )}
            >
              {/* Dot indicator */}
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  isSelected ? "bg-primary-content" : "bg-primary"
                )}
              />

              {/* Content */}
              <span className="flex flex-col items-start min-w-0">
                <span className="font-medium truncate max-w-[120px]">
                  {label}
                </span>
                {timestamp && (
                  <span
                    className={cn(
                      "text-xs",
                      isSelected
                        ? "text-primary-content/80"
                        : "text-base-content/60"
                    )}
                  >
                    {timestamp}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Timeline;
