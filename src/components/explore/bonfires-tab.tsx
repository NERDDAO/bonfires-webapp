"use client";

import { useMemo } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";

import { useBonfiresQuery } from "@/hooks";
import type { BonfireInfo } from "@/types";

import BonfireCard from "@/components/explore/bonfire-card";

// ─── Sort options ────────────────────────────────────────────────────────────

export type SortKey = "newest" | "updated" | "name" | "episodes";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
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

// ─── Fuse config ─────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

const SKELETON_COUNT = 8;

interface BonfiresTabProps {
  search: string;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
}

export default function BonfiresTab({ search, sortKey, onSortChange }: BonfiresTabProps) {
  const { data, isLoading, isError, error } = useBonfiresQuery();
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
    <div>
      {/* Sort pills */}
      <div className="flex items-center gap-1.5 mb-5">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onSortChange(opt.key)}
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
            <p className="text-dark-s-60 text-lg">
              No bonfires match &ldquo;{search.trim()}&rdquo;
            </p>
          ) : (
            <p className="text-dark-s-60 text-lg">No public bonfires found.</p>
          )}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="mt-4 text-center text-sm text-red-400">
          {error instanceof Error ? error.message : "Failed to load bonfires"}
        </div>
      )}
    </div>
  );
}
