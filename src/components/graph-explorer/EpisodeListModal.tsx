"use client";

/**
 * EpisodeListModal
 *
 * Modal with episode list. Same functionality as Timeline (select episode).
 */

import { useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { SkeletonLoader } from "@/components/common";
import type { EpisodeTimelineItem } from "./Timeline";

export interface EpisodeListModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodes: EpisodeTimelineItem[];
  selectedEpisodeId: string | null;
  onEpisodeSelect: (episodeUuid: string) => void;
  loading?: boolean;
  className?: string;
}

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

export function EpisodeListModal({
  isOpen,
  onClose,
  episodes,
  selectedEpisodeId,
  onEpisodeSelect,
  loading = false,
  className,
}: EpisodeListModalProps) {
  const sortedEpisodes = useMemo(() => {
    return [...episodes].sort((a, b) => {
      const aTime = a.valid_at ? new Date(a.valid_at).getTime() : Infinity;
      const bTime = b.valid_at ? new Date(b.valid_at).getTime() : Infinity;
      return aTime - bTime;
    });
  }, [episodes]);

  function handleSelect(uuid: string) {
    onEpisodeSelect(uuid);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Episodes"
      size="md"
      className={cn("max-h-[80vh] flex flex-col", className)}
    >
      <div className="overflow-y-auto max-h-[60vh] pt-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <SkeletonLoader width={12} height={12} radius="full" />
                <SkeletonLoader width="100%" height={40} />
              </div>
            ))}
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-sm text-base-content/50 text-center py-8">
            No episodes available
          </div>
        ) : (
          <ul className="space-y-1" role="listbox" aria-label="Episode list">
            {sortedEpisodes.map((episode) => {
              const isSelected = episode.uuid === selectedEpisodeId;
              const label = episode.name || episode.uuid.slice(0, 8);
              const timestamp = formatEpisodeDate(episode.valid_at);

              return (
                <li key={episode.uuid} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => handleSelect(episode.uuid)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm",
                      "hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/50",
                      isSelected
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "bg-base-100 text-base-content border border-transparent"
                    )}
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        isSelected ? "bg-primary" : "bg-base-300"
                      )}
                    />
                    <span className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate">{label}</span>
                      {timestamp && (
                        <span className="text-xs text-base-content/60">
                          {timestamp}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
