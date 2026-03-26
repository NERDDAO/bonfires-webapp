"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { useHackathonTracks } from "@/hooks";
import TrackCard, { TrackCardSkeleton } from "@/components/hackathon/track-card";
import ExploreTabs, { type ExploreTab } from "@/components/explore/explore-tabs";
import HyperBlogsTab from "@/components/explore/hyperblogs-tab";
import DataRoomsTab from "@/components/explore/datarooms-tab";
import BonfiresTab, { type SortKey } from "@/components/explore/bonfires-tab";

function ExplorePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL-synced state
  const tab = (searchParams.get("tab") as ExploreTab) || "hyperblogs";
  const urlSearch = searchParams.get("q") || "";
  const [search, setSearch] = useState(urlSearch);
  const [bonfireSortKey, setBonfireSortKey] = useState<SortKey>("newest");

  // Hackathon tracks
  const { data: tracks, isLoading: tracksLoading } = useHackathonTracks();
  const activeTracks = (tracks ?? []).filter(
    (t) => t.status === "active" || t.status === "upcoming",
  );

  const updateUrl = useCallback(
    (newTab: ExploreTab, newSearch: string) => {
      const params = new URLSearchParams();
      if (newTab !== "hyperblogs") params.set("tab", newTab);
      if (newSearch.trim()) params.set("q", newSearch.trim());
      const qs = params.toString();
      router.replace(`/explore${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router],
  );

  const handleTabChange = useCallback(
    (newTab: ExploreTab) => {
      setSearch(""); // Clear search on tab switch
      updateUrl(newTab, "");
    },
    [updateUrl],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    // URL updates handled on blur/enter to avoid per-keystroke history churn
  }, []);

  return (
    <main className="flex flex-col px-6 lg:px-20 py-7 lg:py-18 min-h-screen max-w-screen-2xl mx-auto">
      {/* Hackathon Tracks Banner */}
      {(tracksLoading || activeTracks.length > 0) && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-montserrat text-lg lg:text-xl font-bold text-dark-s-0">
              Active Hackathon Tracks
            </h2>
            <a
              href="/hackathon"
              className="text-brand-primary text-sm hover:underline no-underline"
            >
              View all
            </a>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {tracksLoading
              ? Array.from({ length: 3 }, (_, i) => (
                  <TrackCardSkeleton key={`track-skel-${i}`} />
                ))
              : activeTracks.map((track) => (
                  <TrackCard key={track.id} track={track} compact />
                ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-montserrat text-2xl lg:text-4xl font-bold text-dark-s-0">Explore</h1>
        <p className="mt-2 text-dark-s-60 text-sm lg:text-base max-w-2xl">
          Discover hyperblogs, data rooms, and bonfires across the ecosystem.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-s-80 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={
            tab === "hyperblogs"
              ? "Search hyperblogs..."
              : tab === "datarooms"
                ? "Search data rooms..."
                : "Search bonfires..."
          }
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FFFFFF08] border border-[#333333] text-sm text-dark-s-0 placeholder:text-dark-s-80 focus:outline-none focus:border-brand-primary/50 transition-colors"
        />
      </div>

      {/* Tabs */}
      <ExploreTabs activeTab={tab} onTabChange={handleTabChange} />

      {/* Content */}
      {tab === "hyperblogs" && <HyperBlogsTab search={search} />}
      {tab === "datarooms" && <DataRoomsTab search={search} />}
      {tab === "bonfires" && (
        <BonfiresTab search={search} sortKey={bonfireSortKey} onSortChange={setBonfireSortKey} />
      )}
    </main>
  );
}

// Wrap in Suspense for useSearchParams (required by Next.js App Router)
export default function ExplorePage() {
  return (
    <Suspense>
      <ExplorePageInner />
    </Suspense>
  );
}
