/**
 * useHackathonQuery Hooks
 *
 * React Query hooks for hackathon tracks, leaderboards, and mentors.
 */
"use client";

import type { HackathonTrackInfo, LeaderboardResponse, MentorInfo } from "@/types";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";

export const hackathonTracksQueryKey = ["hackathon-tracks"] as const;

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    (pair): pair is [string, string | number] => pair[1] != null,
  );
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

export function useHackathonTracks(cadence?: string) {
  return useQuery({
    queryKey: [...hackathonTracksQueryKey, cadence],
    queryFn: () =>
      apiClient.get<HackathonTrackInfo[]>(
        `/api/hackathon/tracks${buildQuery({ cadence })}`,
      ),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useHackathonTrack(trackId: string | null) {
  return useQuery({
    queryKey: ["hackathon-track", trackId],
    queryFn: () =>
      apiClient.get<HackathonTrackInfo>(`/api/hackathon/tracks/${trackId}`),
    enabled: !!trackId,
    staleTime: 60 * 1000,
  });
}

export function useLeaderboard(
  trackId: string,
  sortBy: string = "agentic_score",
  page: number = 1,
  perPage: number = 20,
) {
  return useQuery({
    queryKey: ["hackathon-leaderboard", trackId, sortBy, page],
    queryFn: () =>
      apiClient.get<LeaderboardResponse>(
        `/api/hackathon/tracks/${trackId}/leaderboard${buildQuery({
          sort_by: sortBy,
          page,
          per_page: perPage,
        })}`,
      ),
    enabled: !!trackId,
    staleTime: 30 * 1000,
  });
}

export function useMentors(trackId?: string) {
  return useQuery({
    queryKey: ["hackathon-mentors", trackId],
    queryFn: () =>
      apiClient.get<MentorInfo[]>(
        `/api/hackathon/mentors${buildQuery({ track_id: trackId })}`,
      ),
    staleTime: 5 * 60 * 1000,
  });
}
