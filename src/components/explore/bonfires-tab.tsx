"use client";

import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";

import { useBonfiresQuery } from "@/hooks";
import { useSubdomainBonfire } from "@/contexts/SubdomainBonfireContext";
import { useLocalStorage, STORAGE_KEYS } from "@/hooks/useLocalStorage";
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
const FILTER_PAGE_SIZE = 20;

interface BonfiresTabProps {
  search: string;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
}

export default function BonfiresTab({ search, sortKey, onSortChange }: BonfiresTabProps) {
  const { data, isLoading, isError, error } = useBonfiresQuery();
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();
  const currentBonfireId = isSubdomainScoped ? subdomainConfig?.bonfireId : undefined;

  const [excludedIds, setExcludedIds] = useLocalStorage<string[]>(
    STORAGE_KEYS.EXPLORE_EXCLUDED_BONFIRES,
    [],
  );
  const toggleBonfire = useCallback(
    (id: string) => {
      setExcludedIds((prev) => {
        const set = new Set(prev);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        return Array.from(set);
      });
    },
    [setExcludedIds],
  );

  // Close filter dropdown on outside click (only when open)
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => {
    if (!filterOpen) return;
    function handleClick(e: MouseEvent) {
      if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
        detailsRef.current.removeAttribute("open");
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filterOpen]);

  const bonfires: BonfireInfo[] = data?.bonfires ?? [];

  const publicBonfires = useMemo(
    () => bonfires.filter((b) => b.is_public !== false),
    [bonfires],
  );

  const fuse = useMemo(
    () => new Fuse(publicBonfires, FUSE_OPTIONS),
    [publicBonfires],
  );

  // Prune stale excluded IDs that no longer match any loaded bonfire
  const validExcludedSet = useMemo(() => {
    const bonfireIds = new Set(publicBonfires.map((b) => b.id));
    const pruned = excludedIds.filter((id) => bonfireIds.has(id));
    if (pruned.length !== excludedIds.length) setExcludedIds(pruned);
    return new Set(pruned);
  }, [publicBonfires, excludedIds, setExcludedIds]);

  // Split search from exclusion so toggling a bonfire doesn't re-run Fuse
  const searched = useMemo(() => {
    const trimmed = search.trim();
    return trimmed
      ? fuse.search(trimmed).map((r) => r.item)
      : publicBonfires;
  }, [publicBonfires, fuse, search]);

  const filtered = useMemo(
    () => sortBonfires(searched.filter((b) => !validExcludedSet.has(b.id)), sortKey),
    [searched, validExcludedSet, sortKey],
  );

  const hiddenCount = validExcludedSet.size;

  const [filterSearch, setFilterSearch] = useState("");
  const [filterPage, setFilterPage] = useState(0);

  const handleFilterSearch = useCallback((value: string) => {
    setFilterSearch(value);
    setFilterPage(0);
  }, []);

  const filterableList = useMemo(() => {
    const q = filterSearch.trim().toLowerCase();
    if (!q) return publicBonfires;
    return publicBonfires.filter((b) => b.name.toLowerCase().includes(q));
  }, [publicBonfires, filterSearch]);

  const filterPageCount = Math.max(1, Math.ceil(filterableList.length / FILTER_PAGE_SIZE));
  const filterSlice = useMemo(
    () => filterableList.slice(filterPage * FILTER_PAGE_SIZE, (filterPage + 1) * FILTER_PAGE_SIZE),
    [filterableList, filterPage],
  );

  return (
    <div>
      {/* Sort pills + filter */}
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

        {/* Filter toggle */}
        <details ref={detailsRef} className="relative inline-block ml-auto" onToggle={(e) => setFilterOpen((e.target as HTMLDetailsElement).open)}>
          <summary
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer list-none select-none transition-colors ${
              hiddenCount > 0
                ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/40"
                : "bg-[#FFFFFF08] text-dark-s-60 border border-transparent hover:border-[#444444]"
            }`}
          >
            Filter{hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ""}
          </summary>
          <div className="absolute right-0 top-full mt-1 z-20 bg-[#1a1a1a] border border-[#333333] rounded-lg p-3 min-w-[260px] max-w-[320px] shadow-xl">
            <div className="text-[10px] uppercase tracking-wider text-dark-s-80 mb-2 font-semibold">
              Show / Hide Bonfires
            </div>

            {/* Search within filter */}
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => handleFilterSearch(e.target.value)}
              placeholder="Search bonfires..."
              className="w-full mb-2 px-2 py-1.5 rounded bg-[#FFFFFF08] border border-[#333333] text-xs text-dark-s-0 placeholder:text-dark-s-80 focus:outline-none focus:border-brand-primary/50 transition-colors"
            />

            {/* Paginated bonfire list */}
            <div className="max-h-[240px] overflow-y-auto">
              {filterSlice.map((bonfire) => (
                <label
                  key={bonfire.id}
                  className="flex items-center gap-2 py-1.5 text-xs text-dark-s-60 cursor-pointer hover:text-dark-s-0 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={!validExcludedSet.has(bonfire.id)}
                    onChange={() => toggleBonfire(bonfire.id)}
                    className="accent-[#f5572a] rounded shrink-0"
                  />
                  <span className="truncate">{bonfire.name}</span>
                </label>
              ))}
              {filterableList.length === 0 && (
                <p className="text-[10px] text-dark-s-80 py-2 text-center">No matches</p>
              )}
            </div>

            {/* Pagination controls */}
            {filterPageCount > 1 && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#333333]">
                <button
                  onClick={() => setFilterPage((p) => Math.max(0, p - 1))}
                  disabled={filterPage === 0}
                  className="text-[10px] text-dark-s-60 hover:text-dark-s-0 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <span className="text-[10px] text-dark-s-80">
                  {filterPage + 1} / {filterPageCount}
                </span>
                <button
                  onClick={() => setFilterPage((p) => Math.min(filterPageCount - 1, p + 1))}
                  disabled={filterPage >= filterPageCount - 1}
                  className="text-[10px] text-dark-s-60 hover:text-dark-s-0 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {/* Show all reset */}
            {hiddenCount > 0 && (
              <button
                onClick={() => setExcludedIds([])}
                className="mt-2 w-full text-[10px] uppercase tracking-wider text-brand-primary hover:text-brand-primary/80 transition-colors"
              >
                Show all
              </button>
            )}
          </div>
        </details>
      </div>

      {/* List */}
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

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && !isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {hiddenCount > 0 ? (
            <p className="text-dark-s-60 text-lg">
              All bonfires are filtered out.{" "}
              <button
                onClick={() => setExcludedIds([])}
                className="text-brand-primary hover:underline"
              >
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

      {/* Error state */}
      {isError && (
        <div className="mt-4 text-center text-sm text-red-400">
          {error instanceof Error ? error.message : "Failed to load bonfires"}
        </div>
      )}
    </div>
  );
}
