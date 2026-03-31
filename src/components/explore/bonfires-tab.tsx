"use client";

import { useMemo } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";

import { useBonfiresQuery } from "@/hooks";
import { useSubdomainBonfire } from "@/contexts/SubdomainBonfireContext";
import type { BonfireInfo } from "@/types";

import BonfireCard from "@/components/explore/bonfire-card";
import BonfireFilterDropdown, { useBonfireFilter } from "@/components/explore/bonfire-filter-dropdown";

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
      return sorted.sort((a, b) => {
        // Use latest episode creation time — reflects actual activity, not bonfire metadata changes
        const aTime = a.latest_episode?.created_at ?? a.updated_at ?? a.created_at ?? 0;
        const bTime = b.latest_episode?.created_at ?? b.updated_at ?? b.created_at ?? 0;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
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
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();
  const currentBonfireId = isSubdomainScoped ? subdomainConfig?.bonfireId : undefined;

  const filter = useBonfireFilter();

  const bonfires: BonfireInfo[] = data?.bonfires ?? [];
  const publicBonfires = useMemo(
    () => bonfires.filter((b) => b.is_public !== false),
    [bonfires],
  );

  const fuse = useMemo(
    () => new Fuse(publicBonfires, FUSE_OPTIONS),
    [publicBonfires],
  );

  const searched = useMemo(() => {
    const trimmed = search.trim();
    return trimmed ? fuse.search(trimmed).map((r) => r.item) : publicBonfires;
  }, [publicBonfires, fuse, search]);

  const filtered = useMemo(
    () => sortBonfires(searched.filter((b) => !filter.excludedSet.has(b.id)), sortKey),
    [searched, filter.excludedSet, sortKey],
  );

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
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
        <BonfireFilterDropdown {...filter} />
      </div>

      <div className="flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <BonfireCard key={`skeleton-${i}`} isLoading />
            ))
          : filtered.map((bonfire) => (
              <BonfireCard
                key={bonfire.id}
                data={bonfire}
                isHighlighted={bonfire.id === currentBonfireId}
              />
            ))}
      </div>

      {!isLoading && filtered.length === 0 && !isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {filter.hiddenCount > 0 ? (
            <p className="text-dark-s-60 text-lg">
              All bonfires are filtered out.{" "}
              <button onClick={filter.resetFilter} className="text-brand-primary hover:underline">
                Show all
              </button>
            </p>
          ) : search.trim() ? (
            <p className="text-dark-s-60 text-lg">
              No bonfires match &ldquo;{search.trim()}&rdquo;
            </p>
          ) : (
            <p className="text-dark-s-60 text-lg">No public bonfires found.</p>
          )}
        </div>
      )}

      {isError && (
        <div className="mt-4 text-center text-sm text-red-400">
          {error instanceof Error ? error.message : "Failed to load bonfires"}
        </div>
      )}
    </div>
  );
}
