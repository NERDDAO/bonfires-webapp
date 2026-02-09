"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import type { AgentLatestEpisodesResponse } from "@/types";

import EpisodesList from "@/components/graph-explorer/select-panel/episodes-list";
import type { EpisodeTimelineItem } from "@/components/graph-explorer/select-panel/panel-types";

import { apiClient } from "@/lib/api/client";

export interface HeroRecentActivityProps {
  staticGraph: { staticBonfireId: string; staticAgentId: string };
  className?: string;
  /** Ref for the scrollable container (used for scroll-linked animation). */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function HeroRecentActivity({
  staticGraph,
  className,
  scrollContainerRef,
}: HeroRecentActivityProps) {
  const router = useRouter();
  const [episodes, setEpisodes] = useState<EpisodeTimelineItem[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchEpisodes() {
      const { staticAgentId } = staticGraph;
      setEpisodesLoading(true);
      try {
        const response = await apiClient.post<AgentLatestEpisodesResponse>(
          `/api/agents/${staticAgentId}/episodes/search`,
          { limit: 10 }
        );

        if (cancelled) return;

        const items: EpisodeTimelineItem[] = (response.episodes ?? []).map(
          (episode) => {
            const r = episode as Record<string, unknown>;
            return {
              uuid: String(r["uuid"] ?? r["id"] ?? ""),
              name: (r["name"] ?? r["title"]) as string | undefined,
              valid_at: r["valid_at"] as string | undefined,
              content: (r["summary"] ?? r["content"]) as string | undefined,
            };
          }
        );
        setEpisodes(items.filter((e) => e.uuid));
      } catch {
        if (!cancelled) setEpisodes([]);
      } finally {
        if (!cancelled) setEpisodesLoading(false);
      }
    }

    fetchEpisodes();
    return () => {
      cancelled = true;
    };
  }, [staticGraph.staticAgentId]);

  const handleEpisodeSelect = (episodeUuid: string) => {
    const params = new URLSearchParams();
    params.set("bonfireId", staticGraph.staticBonfireId);
    params.set("agentId", staticGraph.staticAgentId);
    params.set("centerNode", episodeUuid);
    router.push(`/graph?${params.toString()}`);
  };

  return (
    <div className={className}>
      <EpisodesList
        episodes={episodes}
        selectedEpisodeId={null}
        onEpisodeSelect={handleEpisodeSelect}
        episodesLoading={episodesLoading}
        showTitle={true}
        variant="hero"
        scrollContainerRef={scrollContainerRef}
      />
    </div>
  );
}
