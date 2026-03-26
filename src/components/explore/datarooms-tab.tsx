"use client";

import { useEffect, useMemo, useRef } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";

import { useSubdomainBonfire } from "@/contexts/SubdomainBonfireContext";
import { useDataRoomsInfiniteQuery } from "@/hooks";
import type { DataRoomInfo } from "@/types/api";

import DataroomCard from "@/components/hyperblogs/dataroom-card";

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

interface DataRoomsTabProps {
  search: string;
}

export default function DataRoomsTab({ search }: DataRoomsTabProps) {
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();
  const bonfireId = isSubdomainScoped ? subdomainConfig?.bonfireId : undefined;

  const { data, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useDataRoomsInfiniteQuery({ pageSize: PAGE_SIZE, bonfireId, sortBy: "total_purchases" });

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
    if (!trimmed) return allDatarooms;
    return fuse.search(trimmed).map((r) => r.item);
  }, [allDatarooms, fuse, search]);

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
      {/* Dataroom grid */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
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
