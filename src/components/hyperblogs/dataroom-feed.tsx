"use client";

import { useEffect, useRef } from "react";

import { useSubdomainBonfire } from "@/contexts/SubdomainBonfireContext";
import { hyperblogsCopy } from "@/content/hyperblogs";
import { useDataRoomsInfiniteQuery } from "@/hooks";

import { DataRoomInfo } from "@/types/api";

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
  const { dataroomTitle, dataroomTooltipContent } = hyperblogsCopy;
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

        <div
          className="tooltip tooltip-right flex text-brand-primary"
          data-tip={dataroomTooltipContent}
        >
          <svg
            width="35"
            height="35"
            viewBox="0 0 35 35"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="cursor-help h-4 w-4 lg:h-6 lg:w-6"
            aria-label="Tooltip"
          >
            <circle cx="17.2651" cy="17.2651" r="15.937" stroke="currentColor" strokeWidth="2.65617"/>
            <path d="M17.1324 23.8745H17.1458" stroke="currentColor" strokeWidth="2.65617" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.2809 13.25C13.5996 12.3717 14.2169 11.6333 15.0248 11.1639C15.8328 10.6945 16.78 10.5241 17.7009 10.6823C18.6218 10.8405 19.4578 11.3174 20.0627 12.0295C20.6676 12.7417 21.0031 13.6437 21.0103 14.5781C21.0103 17.2343 17.0261 18.5624 17.0261 18.5624" stroke="currentColor" strokeWidth="2.65617" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
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
