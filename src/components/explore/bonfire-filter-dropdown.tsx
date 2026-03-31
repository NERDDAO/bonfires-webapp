"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useBonfiresQuery } from "@/hooks";
import { useLocalStorage, STORAGE_KEYS } from "@/hooks/useLocalStorage";
import type { BonfireInfo } from "@/types";

const FILTER_PAGE_SIZE = 20;

export function useBonfireFilter() {
  const { data } = useBonfiresQuery();
  const bonfires: BonfireInfo[] = data?.bonfires ?? [];
  const publicBonfires = useMemo(
    () => bonfires.filter((b) => b.is_public !== false),
    [bonfires],
  );

  const [excludedIds, setExcludedIds] = useLocalStorage<string[]>(
    STORAGE_KEYS.EXPLORE_EXCLUDED_BONFIRES,
    [],
  );

  // Prune stale IDs
  const validExcludedSet = useMemo(() => {
    const bonfireIds = new Set(publicBonfires.map((b) => b.id));
    const pruned = excludedIds.filter((id) => bonfireIds.has(id));
    if (pruned.length !== excludedIds.length) setExcludedIds(pruned);
    return new Set(pruned);
  }, [publicBonfires, excludedIds, setExcludedIds]);

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

  return {
    publicBonfires,
    excludedSet: validExcludedSet,
    hiddenCount: validExcludedSet.size,
    toggleBonfire,
    resetFilter: () => setExcludedIds([]),
  };
}

interface BonfireFilterDropdownProps {
  publicBonfires: BonfireInfo[];
  excludedSet: Set<string>;
  hiddenCount: number;
  toggleBonfire: (id: string) => void;
  resetFilter: () => void;
}

export default function BonfireFilterDropdown({
  publicBonfires,
  excludedSet,
  hiddenCount,
  toggleBonfire,
  resetFilter,
}: BonfireFilterDropdownProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterPage, setFilterPage] = useState(0);

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
    <details
      ref={detailsRef}
      className="relative inline-block ml-auto"
      onToggle={(e) => setFilterOpen((e.target as HTMLDetailsElement).open)}
    >
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
          Filter by Bonfire
        </div>

        <input
          type="text"
          value={filterSearch}
          onChange={(e) => handleFilterSearch(e.target.value)}
          placeholder="Search bonfires..."
          className="w-full mb-2 px-2 py-1.5 rounded bg-[#FFFFFF08] border border-[#333333] text-xs text-dark-s-0 placeholder:text-dark-s-80 focus:outline-none focus:border-brand-primary/50 transition-colors"
        />

        <div className="max-h-[240px] overflow-y-auto">
          {filterSlice.map((bonfire) => (
            <label
              key={bonfire.id}
              className="flex items-center gap-2 py-1.5 text-xs text-dark-s-60 cursor-pointer hover:text-dark-s-0 transition-colors"
            >
              <input
                type="checkbox"
                checked={!excludedSet.has(bonfire.id)}
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

        {hiddenCount > 0 && (
          <button
            onClick={resetFilter}
            className="mt-2 w-full text-[10px] uppercase tracking-wider text-brand-primary hover:text-brand-primary/80 transition-colors"
          >
            Show all
          </button>
        )}
      </div>
    </details>
  );
}
