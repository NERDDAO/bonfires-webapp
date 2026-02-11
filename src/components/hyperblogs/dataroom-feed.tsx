"use client";

import { useEffect, useRef } from "react";

import { useSubdomainBonfire } from "@/contexts/SubdomainBonfireContext";
import { hyperblogsCopy } from "@/content/hyperblogs";
import { useDataRoomsInfiniteQuery } from "@/hooks";

import { DataRoomInfo } from "@/types/api";

import { InfoTooltip } from "@/components/ui/tooltip";

import DataroomCard from "./dataroom-card";

const PAGE_SIZE = 4;

export default function DataroomFeed() {
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();
  const bonfireId = isSubdomainScoped ? subdomainConfig?.bonfireId : undefined;

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDataRoomsInfiniteQuery({ pageSize: PAGE_SIZE, bonfireId });

  const sentinelRef = useRef<HTMLDivElement>(null);
  const { dataroomTitle, dataroomDescription, dataroomTooltipContent } = hyperblogsCopy;
  const dataRooms =
    data?.pages.flatMap(
      (page: { datarooms: DataRoomInfo[] }) => page.datarooms
    ) ?? [];
  const placeholderCount = isFetchingNextPage ? PAGE_SIZE : 0;
  const totalCount = dataRooms.length + placeholderCount;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <div className="flex items-center gap-2 mt-6 font-montserrat text-lg lg:text-[2rem] font-black lg:font-bold">
        <span>{dataroomTitle}</span>

        <InfoTooltip
          content={dataroomTooltipContent}
          side="right"
          sideAtLg="right"
          iconSize="sm"
          tooltipClassName="max-w-60"
        />
      </div>

      <div className="mt-1 font-laro-soft text-sm lg:text-base">
        {dataroomDescription}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: totalCount || PAGE_SIZE }, (_, index) => {
          const dataroom = dataRooms[index];
          return index < dataRooms.length && dataroom ? (
            <DataroomCard key={dataroom.id} data={dataroom} />
          ) : (
            <DataroomCard key={`skeleton-${index}`} isLoading />
          );
        })}
      </div>

      <div ref={sentinelRef} className="h-1 min-h-1" aria-hidden="true" />

      {isError && (
        <div className="mt-4 text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load datarooms"}
        </div>
      )}
    </>
  );
}
