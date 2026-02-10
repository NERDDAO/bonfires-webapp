"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { useDataRoomHyperBlogsInfiniteQuery } from "@/hooks";

import { cn } from "@/lib/cn";
import { formatReadingTime, getTextFromMarkdown } from "@/lib/utils";

const PAGE_SIZE = 4;

const buttonClassName = cn(
  "mt-4 w-full bg-[#22252B]/70 hover:bg-[#22252B]/40 cursor-pointer",
  "transition-colors duration-300 rounded-lg flex flex-col",
  "justify-center items-center gap-1 p-3 min-h-17"
);

export default function HyperblogFeed({ dataroomId }: { dataroomId?: string }) {
  const [showBlogs, setShowBlogs] = useState(false);

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
    dataroomId: dataroomId ?? null,
    pageSize: PAGE_SIZE,
  });

  const hyperblogs = data?.pages.flatMap((page) => page.hyperblogs) ?? [];

  useEffect(() => {
    if (!showBlogs) return;
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
  }, [showBlogs, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <div className={cn("mt-4 w-full rounded-lg overflow-hidden flex flex-col min-h-[120px] max-h-[520px] h-full", hyperblogs.length > 1 && showBlogs ? "" : "mb-4")}>
        <div ref={scrollRef} className={cn("flex-1 overflow-y-auto overflow-x-hidden min-h-0", showBlogs ? "space-y-4" : "")}>
          {isError && (
            <div className="text-xs text-destructive py-1">Failed to load</div>
          )}
          {!isError && !isLoading && hyperblogs.length === 0 && (
            <div className="text-xs text-[#A9A9A9] py-1 flex items-center justify-center min-h-17">
              No hyperblogs found
            </div>
          )}
          {hyperblogs.slice(0, showBlogs ? undefined : 1).map((blog) => {
            const title = blog.user_query || blog.preview || "Untitled";
            const description = getTextFromMarkdown(blog.preview || "");
            const {
              formattedBlogLength,
              formattedWordCount,
              formattedReadingTime,
            } = formatReadingTime(blog.word_count || 0);
            return (
              <Link
                key={blog.id}
                href={`/hyperblogs/${blog.id}`}
                className="rounded-lg flex flex-col py-3 px-4 bg-[#22252B]/70 hover:bg-[#22252B]/40 cursor-pointer transition-colors duration-300"
              >
                <div className="font-bold text-white capitalize line-clamp-1">
                  {title}
                </div>
                <div className="mt-2 text-[#A9A9A9] line-clamp-2">
                  {description}
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {[
                    { value: formattedBlogLength, className: "" },
                    { value: formattedWordCount, className: "" },
                    { value: formattedReadingTime, className: "" },
                  ].map((item) => (
                    <span
                      key={item.value}
                      className={cn(
                        "text-xs text-left rounded-full px-3 py-1 text-white border border-[#646464]/50 whitespace-nowrap",
                        item.className
                      )}
                    >
                      {item.value}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}

          {isFetchingNextPage && (
            <div className="text-xs text-[#A9A9A9] py-1 w-full text-center">
              Loading…
            </div>
          )}
          <div
            ref={sentinelRef}
            className="h-2 min-h-2 shrink-0"
            aria-hidden="true"
          />

          {hyperblogs.length > 1 && !showBlogs && (
            <button
              type="button"
              onClick={() => setShowBlogs(true)}
              className={buttonClassName}
            >
              <Image
                src="/icons/chevron-down.svg"
                alt="Chevron down"
                width={16}
                height={16}
                className="rotate-0"
              />
              <span className="font-bold text-white">
                Show more
              </span>
            </button>
          )}
        </div>
      </div>

      {hyperblogs.length > 1 && showBlogs && (
        <button
          type="button"
          onClick={() => setShowBlogs(false)}
          className={cn(buttonClassName, "mt-0 mb-4")}
        >
          <Image
            src="/icons/chevron-down.svg"
            alt="Chevron down"
            width={16}
            height={16}
            className="rotate-180"
          />
          <span className="font-bold text-white">
            Hide blogs
          </span>
        </button>
      )}
    </>
  );
}
