"use client";

import { useEffect, useMemo, useRef } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";

import { useSubdomainBonfire } from "@/contexts/SubdomainBonfireContext";
import { useDataRoomsInfiniteQuery } from "@/hooks";
import type { DataRoomInfo } from "@/types/api";

import DataroomCard from "@/components/hyperblogs/dataroom-card";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;

const FUSE_OPTIONS: IFuseOptions<DataRoomInfo> = {
  keys: [
    { name: "description", weight: 2 },
    { name: "bonfire_name", weight: 1.5 },
    { name: "center_node_name", weight: 1 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export type DataRoomSortKey = "total_purchases" | "created_at" | "price_low" | "price_high";

export const DATAROOM_SORT_OPTIONS: { key: DataRoomSortKey; label: string }[] = [
  { key: "total_purchases", label: "Most Popular" },
  { key: "created_at", label: "Newest" },
  { key: "price_low", label: "Price: Low" },
  { key: "price_high", label: "Price: High" },
];

interface DataRoomsTabProps {
  search: string;
  sortBy: DataRoomSortKey;
  onSortChange: (key: DataRoomSortKey) => void;
}

export default function DataRoomsTab({ search, sortBy, onSortChange }: DataRoomsTabProps) {
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();
  const bonfireId = isSubdomainScoped ? subdomainConfig?.bonfireId : undefined;

  // Price sorts are client-side; API only supports total_purchases and created_at
  const apiSortBy = sortBy === "price_low" || sortBy === "price_high" ? "created_at" : sortBy;

  const { data, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useDataRoomsInfiniteQuery({ pageSize: PAGE_SIZE, bonfireId, sortBy: apiSortBy });

  const sentinelRef = useRef<HTMLDivElement>(null);

  const allDatarooms: DataRoomInfo[] = useMemo(
    () =>
      data?.pages.flatMap(
        (page: { datarooms: DataRoomInfo[] }) => page.datarooms,
      ) ?? [],
    [data],
  );

  const fuse = useMemo(() => new Fuse(allDatarooms, FUSE_OPTIONS), [allDatarooms]);
  const filtered: DataRoomInfo[] = useMemo(() => {
    const trimmed = search.trim();
    let results = trimmed ? fuse.search(trimmed).map((r) => r.item) : allDatarooms;

    // Client-side price sort
    if (sortBy === "price_low" || sortBy === "price_high") {
      const getPrice = (dr: DataRoomInfo) =>
        dr.current_hyperblog_price_usd ? parseFloat(dr.current_hyperblog_price_usd) : dr.price_usd;
      results = [...results].sort((a, b) =>
        sortBy === "price_low" ? getPrice(a) - getPrice(b) : getPrice(b) - getPrice(a),
      );
    }

    return results;
  }, [allDatarooms, fuse, search, sortBy]);

  const placeholderCount = isFetchingNextPage ? PAGE_SIZE : 0;
  const totalCount = filtered.length + placeholderCount;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div>
      {/* Sort pills */}
      <div className="flex items-center gap-1.5 mb-4 mt-1">
        {DATAROOM_SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onSortChange(opt.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              sortBy === opt.key
                ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/40"
                : "bg-[#FFFFFF08] text-dark-s-60 border border-transparent hover:border-[#444444]",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Dataroom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: totalCount || PAGE_SIZE }, (_, index) => {
          const dataroom = filtered[index];
          return index < filtered.length && dataroom ? (
            <DataroomCard key={dataroom.id} data={dataroom} />
          ) : (
            <DataroomCard key={`skeleton-${index}`} isLoading />
          );
        })}
      </div>

      <div ref={sentinelRef} className="h-1 min-h-1" aria-hidden="true" />

      {!isFetchingNextPage && filtered.length === 0 && (
        <p className="text-center text-dark-s-60 py-12">
          {search.trim()
            ? `No data rooms match "${search.trim()}"`
            : "No data rooms found."}
        </p>
      )}

      {isError && (
        <div className="mt-4 text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load data rooms"}
        </div>
      )}
    </div>
  );
}
