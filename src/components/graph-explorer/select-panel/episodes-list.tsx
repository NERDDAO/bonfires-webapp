import { SkeletonLoader } from "@/components/common";
import { EpisodeTimelineItem } from "@/components/graph/Timeline";

import { cn } from "@/lib/cn";

import { parseEpisodeContent } from "../wiki/wiki-panel-utils";
import { labelClass, panelContainerClass } from "./select-panel-constants";

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

export interface EpisodesListProps {
  episodes: EpisodeTimelineItem[];
  selectedEpisodeId: string | null;
  onEpisodeSelect: (episodeUuid: string) => void;
  episodesLoading?: boolean;
  /** When false, the "Recent Activity" heading is not rendered (e.g. when parent shows its own header). Default true. */
  showTitle?: boolean;
  className?: string;
  variant?: "default" | "hero";
  /** Ref for the scrollable container (hero variant only). Used for scroll-linked animation. */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function EpisodesList({
  episodes,
  selectedEpisodeId,
  onEpisodeSelect,
  episodesLoading = false,
  showTitle = true,
  className,
  variant = "default",
  scrollContainerRef,
}: EpisodesListProps) {
  // reverse sort episodes by date
  const sortedEpisodes = [...episodes]
    .sort((a, b) => {
      const aTime = a.valid_at ? new Date(a.valid_at).getTime() : Infinity;
      const bTime = b.valid_at ? new Date(b.valid_at).getTime() : Infinity;
      return bTime - aTime;
    })
    .map((episode) => {
      const episodeContent = parseEpisodeContent({
        uuid: "test",
        content: episode.content,
      });
      return {
        ...episode,
        content: episodeContent.content,
      };
    });

  return (
    <div
      ref={variant === "hero" ? scrollContainerRef : undefined}
      className={cn(
        panelContainerClass,
        "h-full overflow-y-auto overscroll-x-none gap-0",
        variant === "hero"
          ? "max-h-[412px] lg:max-h-[calc(100dvh-8rem)] rounded-b-none border-b-0"
          : "mt-3"
      )}
      aria-label="Episodes"
    >
      {showTitle && (
        <h2
          className={cn(
            labelClass,
            "top-0 z-10 -mx-4 lg:-mx-5 -mt-4 px-4 lg:px-5 pt-4 pb-2 lg:bg-[#181818]",
            variant === "hero"
              ? "sticky text-xl lg:text-2xl font-bold mb-2 lg:mb-6 pt-4 lg:pt-8 pb-2 -top-4 bg-[#181818]"
              : ""
          )}
        >
          Recent Activity
        </h2>
      )}
      <div className="flex-1 -mx-1">
        {episodesLoading ? (
          <div
            className="space-y-3"
            aria-busy="true"
            aria-label="Loading episodes"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="skeleton flex items-center gap-2 p-4 rounded-xl bg-[#1C1D21] border border-transparent"
              >
                <div className="w-0 h-24 rounded-full bg-base-200"></div>
              </div>
            ))}
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-sm text-base-content/50 text-center py-6">
            No episodes available
          </div>
        ) : (
          <div className="space-y-3" role="listbox" aria-label="Episode list">
            {sortedEpisodes.map((episode) => {
              const isSelected = episode.uuid === selectedEpisodeId;
              const label = episode.name || episode.uuid.slice(0, 8);
              const timestamp = formatEpisodeDate(episode.valid_at);

              return (
                <div
                  key={episode.uuid}
                  role="option"
                  aria-selected={isSelected}
                  className=""
                >
                  <button
                    type="button"
                    onClick={() => onEpisodeSelect(episode.uuid)}
                    className={cn(
                      "w-full flex items-center gap-2 p-4 rounded-xl text-left",
                      "hover:bg-[#2D2E33]",
                      isSelected
                        ? "bg-[#2D2E33] text-white border border-white/10"
                        : "bg-[#1C1D21] text-white border border-transparent"
                    )}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="font-medium truncate mb-1">{label}</div>
                      {timestamp && (
                        <span className="text-xs text-base-content/60">
                          {timestamp}
                        </span>
                      )}
                      {episode.content && (
                        <div className="line-clamp-3 mt-3 text-sm">
                          {episode.content}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
