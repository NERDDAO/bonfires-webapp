"use client";

import { useMemo, useState } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";
import { Search } from "lucide-react";

import { useBonfiresQuery } from "@/hooks";
import type { BonfireInfo } from "@/types";

import BonfireCard from "@/components/explore/bonfire-card";

// ─── Sort options ───────────────────────────────────────────────────────────

type SortKey = "newest" | "updated" | "name" | "episodes";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "updated", label: "Recently Updated" },
  { key: "episodes", label: "Most Episodes" },
  { key: "name", label: "Name" },
];

function sortBonfires(list: BonfireInfo[], key: SortKey): BonfireInfo[] {
  const sorted = [...list];
  switch (key) {
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime(),
      );
    case "updated":
      return sorted.sort(
        (a, b) =>
          new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
          new Date(a.updated_at ?? a.created_at ?? 0).getTime(),
      );
    case "episodes":
      return sorted.sort(
        (a, b) => (b.total_episodes ?? 0) - (a.total_episodes ?? 0),
      );
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
}

// ─── Fuse config ────────────────────────────────────────────────────────────

const FUSE_OPTIONS: IFuseOptions<BonfireInfo> = {
  keys: [
    { name: "name", weight: 2 },
    { name: "latest_taxonomies.name", weight: 1.5 },
    { name: "description", weight: 1 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

// ─── Page ───────────────────────────────────────────────────────────────────

const SKELETON_COUNT = 8;

export default function ExploreBonfiresPage() {
  const { data, isLoading, isError, error } = useBonfiresQuery();
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [search, setSearch] = useState("");

  const bonfires: BonfireInfo[] = data?.bonfires ?? [];
  const publicBonfires = useMemo(
    () => bonfires.filter((b) => b.is_public !== false),
    [bonfires],
  );

  const fuse = useMemo(
    () => new Fuse(publicBonfires, FUSE_OPTIONS),
    [publicBonfires],
  );

  const filtered = useMemo(() => {
    const trimmed = search.trim();
    if (!trimmed) return sortBonfires(publicBonfires, sortKey);
    const results = fuse.search(trimmed).map((r) => r.item);
    return sortBonfires(results, sortKey);
  }, [publicBonfires, fuse, search, sortKey]);

  return (
    <main className="flex flex-col px-6 lg:px-20 py-7 lg:py-18 min-h-screen max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-montserrat text-2xl lg:text-4xl font-bold text-dark-s-0">
          Explore Bonfires
        </h1>
        <p className="mt-2 text-dark-s-60 text-sm lg:text-base max-w-2xl">
          Discover publicly available bonfires -- each one is a
          community-driven knowledge space with its own AI agent, knowledge
          graph, and data rooms.
        </p>
      </div>

      {/* Controls: search + sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-s-80 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, topic, or description..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FFFFFF08] border border-[#333333] text-sm text-dark-s-0 placeholder:text-dark-s-80 focus:outline-none focus:border-brand-primary/50 transition-colors"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                sortKey === opt.key
                  ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/40"
                  : "bg-[#FFFFFF08] text-dark-s-60 border border-transparent hover:border-[#444444]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <BonfireCard key={`skeleton-${i}`} isLoading />
          ))
          : filtered.map((bonfire) => (
            <BonfireCard key={bonfire.id} data={bonfire} />
          ))}
      </div>

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && !isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {search.trim() ? (
            <>
              <p className="text-dark-s-60 text-lg">
                No bonfires match &ldquo;{search.trim()}&rdquo;
              </p>
              <button
                onClick={() => setSearch("")}
                className="mt-3 text-brand-primary text-sm hover:underline"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <p className="text-dark-s-60 text-lg">No public bonfires found.</p>
              <p className="text-dark-s-80 text-sm mt-2">
                Check back later -- new bonfires are being created all the time.
              </p>
            </>
          )}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="mt-4 text-center text-sm text-red-400">
          {error instanceof Error ? error.message : "Failed to load bonfires"}
        </div>
      )}
    </main>
  );
}
