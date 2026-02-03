"use client";

import { DataRoomInfo } from "@/types";

import { cn } from "@/lib/cn";
import { truncateAddress } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useDataRoomHyperBlogsInfiniteQuery } from "@/hooks";
import { useEffect, useRef, useState } from "react";

const HYPERBLOGS_PAGE_SIZE = 12;

function DataroomCardSkeleton({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "featured";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl lg:rounded-3xl w-full flex flex-col p-4 lg:p-7.5 bg-[#FFFFFF05] border-[0.78px] border-[#333333] animate-pulse",
        className
      )}
    >
      {/* Title: matches text-base lg:text-xl */}
      <div className="h-4 lg:h-7 w-3/4 bg-[#FFFFFF15] rounded" />
      {/* Description: matches line-clamp-2 text-xs lg:text-sm (2 lines) */}
      <div className="h-8 lg:h-10 w-full bg-[#FFFFFF10] rounded mt-1 lg:mt-2 mb-2" />
      {/* Single meta row with wrapping pills (matches actual card layout) */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="h-5 lg:h-6 w-full lg:w-24 bg-[#FFFFFF15] rounded-full shrink-0" />
        <span className="h-5 lg:h-6 w-full lg:w-28 bg-[#FFFFFF15] rounded-full shrink-0" />
        <span className="h-5 lg:h-6 w-14 bg-[#FFFFFF15] rounded-full shrink-0" />
        <span className="h-5 lg:h-6 w-16 bg-[#FFFFFF15] rounded-full shrink-0" />
        <span className="h-5 lg:h-6 w-14 bg-[#FFFFFF15] rounded-full shrink-0" />
      </div>
      <div
        className={cn(
          "mt-4 w-full bg-[#FFFFFF10] rounded-lg border-[0.78px] border-[#333333]",
          variant === "featured" ? "h-18 lg:h-64" : "h-18 lg:h-32"
        )}
      />
      {/* Stats row: matches icon height 18px + alignment */}
      <div className="mt-4 flex gap-4 items-center">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 lg:h-[18px] w-12 bg-[#FFFFFF10] rounded" />
        ))}
      </div>
    </div>
  );
}

function HyperblogsTitleFeed({ dataroomId }: { dataroomId: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDataRoomHyperBlogsInfiniteQuery({
    dataroomId,
    pageSize: HYPERBLOGS_PAGE_SIZE,
  });

  const hyperblogs = data?.pages.flatMap((page) => page.hyperblogs) ?? [];

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { root, rootMargin: "80px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="mt-4 w-full bg-[#22252B]/70 rounded-lg border border-[#333333] overflow-hidden flex flex-col min-h-[120px] max-h-[240px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2">
        {isError && (
          <div className="text-xs text-destructive py-1">
            {error instanceof Error ? error.message : "Failed to load"}
          </div>
        )}
        {!isError && !isLoading && hyperblogs.length === 0 && (
          <div className="text-xs text-[#A9A9A9] py-1">No hyperblogs yet.</div>
        )}
        {hyperblogs.map((blog) => (
          <Link
            key={blog.id}
            href={`/hyperblogs/${blog.id}`}
            className="block text-xs text-white hover:text-[#A9A9A9] py-1.5 truncate border-b border-[#333333] last:border-b-0"
          >
            {blog.user_query || blog.preview || "Untitled"}
          </Link>
        ))}
        {isFetchingNextPage && (
          <div className="text-xs text-[#A9A9A9] py-1">Loading…</div>
        )}
        <div ref={sentinelRef} className="h-2 min-h-2 shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function DataroomCard({
  data,
  variant = "default",
  isLoading,
  className,
}: {
  data?: DataRoomInfo;
  variant?: "default" | "featured";
  isLoading?: boolean;
  className?: string;
}) {
  const [showBlogs, setShowBlogs] = useState(false);

  if (isLoading) {
    return <DataroomCardSkeleton className={className} variant={variant} />;
  }

  const title = data?.description || "";
  const creatorWallet = truncateAddress(data?.creator_wallet || "", 4);
  const formattedAuthor = `by ${creatorWallet ? creatorWallet : "Anonymous"}`;
  const cost = `Cost: $${data?.price_usd || 0}`;
  return (
    <div
      className={cn(
        "rounded-2xl lg:rounded-3xl w-full flex flex-col p-4 lg:p-7.5 bg-[#FFFFFF05] border-[0.78px] border-[#333333]",
        className
      )}
    >
      <div className="font-bold text-base lg:text-xl capitalize">{title}</div>
      <div className="text-[#A9A9A9] text-xs lg:text-sm mb-2 line-clamp-2">
        {title}
      </div>
      <div className="flex gap-2 flex-wrap mt-auto">
        <span className="w-full lg:w-auto text-center lg:text-left font-bold text-xs rounded-full px-3 py-1 bg-dark-s-700 text-white whitespace-nowrap">
          {formattedAuthor}
        </span>
        {[
          { value: cost, className: "" },
        ].map((item) => (
          <span
            key={item.value}
            className={cn("text-xs text-center flex-1 lg:flex-none lg:text-left rounded-full px-3 py-1 text-white border border-[#646464]/50 whitespace-nowrap", item.className)}
          >
            {item.value}
          </span>
        ))}
      </div>

      {!showBlogs && data?.id && (
        <button
          type="button"
          onClick={() => setShowBlogs(true)}
          className="mt-4 w-full bg-[#22252B]/70 hover:bg-[#22252B]/40 cursor-pointer transition-colors duration-300 rounded-lg flex flex-col justify-center items-center gap-1 p-3"
        >
          <span className="font-bold text-white">Show existing blogs</span>
          <Image
            src="/icons/chevron-down.svg"
            alt="Chevron down"
            width={16}
            height={16}
          />
        </button>
      )}
      {showBlogs && data?.id && (
        <HyperblogsTitleFeed dataroomId={data.id} />
      )}
    </div>
  );
}
