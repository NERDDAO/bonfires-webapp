"use client";

import { useEffect, useMemo, useRef } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";

import { useSubdomainBonfire } from "@/contexts/SubdomainBonfireContext";
import { usePublicHyperBlogsInfiniteQuery } from "@/hooks/queries/useHyperBlogsQuery";
import type { HyperBlogInfo } from "@/types";
import HyperBlogCard from "@/components/hyperblogs/hyperblog-card";
import BonfireFilterDropdown, { useBonfireFilter } from "@/components/explore/bonfire-filter-dropdown";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 8;

const FUSE_OPTIONS: IFuseOptions<HyperBlogInfo> = {
  keys: [
    { name: "title", weight: 2 },
    { name: "user_query", weight: 1.5 },
    { name: "summary", weight: 1 },
    { name: "taxonomy_keywords", weight: 1 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export type HyperBlogSortKey = "upvotes" | "created_at";

export const HYPERBLOG_SORT_OPTIONS: { key: HyperBlogSortKey; label: string }[] = [
  { key: "upvotes", label: "Most Upvoted" },
  { key: "created_at", label: "Newest" },
];

interface HyperBlogsTabProps {
  search: string;
  sortBy: HyperBlogSortKey;
  onSortChange: (key: HyperBlogSortKey) => void;
}

export default function HyperBlogsTab({ search, sortBy, onSortChange }: HyperBlogsTabProps) {
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();
  const bonfireId = isSubdomainScoped ? subdomainConfig?.bonfireId : undefined;
  const filter = useBonfireFilter();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isError, error } =
    usePublicHyperBlogsInfiniteQuery({
      bonfireId,
      sortBy,
      pageSize: PAGE_SIZE,
    });

  const allBlogs: HyperBlogInfo[] = useMemo(
    () =>
      data?.pages.flatMap(
        (page: { hyperblogs: HyperBlogInfo[] }) => page.hyperblogs,
      ) ?? [],
    [data],
  );

  const placeholderCount = isFetchingNextPage ? PAGE_SIZE : 0;

  const fuse = useMemo(() => new Fuse(allBlogs, FUSE_OPTIONS), [allBlogs]);
  const filtered: HyperBlogInfo[] = useMemo(() => {
    const trimmed = search.trim();
    let results = trimmed ? fuse.search(trimmed).map((r) => r.item) : allBlogs;
    results = results.filter((b) => !b.source_bonfire_id || !filter.excludedSet.has(b.source_bonfire_id));
    return results;
  }, [allBlogs, fuse, search, filter.excludedSet]);

  const totalCount = filtered.length + placeholderCount;

  const sentinelRef = useRef<HTMLDivElement>(null);
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
    <>
      {/* Sort pills */}
      <div className="flex items-center gap-1.5 mb-4 mt-1 flex-wrap">
        {HYPERBLOG_SORT_OPTIONS.map((opt) => (
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
        <BonfireFilterDropdown {...filter} />
      </div>

      <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {Array.from({ length: totalCount || PAGE_SIZE }, (_, index) => {
          const blog = filtered[index];
          return index < filtered.length && blog ? (
            <HyperBlogCard
              key={blog.id}
              data={blog}
              href={`/hyperblogs/${blog.id}`}
              variant="featured"
            />
          ) : (
            <HyperBlogCard
              key={`skeleton-${index}`}
              isLoading
              href="#"
              variant="featured"
            />
          );
        })}
      </div>

      <div ref={sentinelRef} className="h-1 min-h-1" aria-hidden="true" />

      {!isFetchingNextPage && filtered.length === 0 && (
        <p className="text-center text-dark-s-60 py-12">
          {search.trim()
            ? `No hyperblogs match "${search.trim()}"`
            : "No hyperblogs found."}
        </p>
      )}

      {isError && (
        <div className="mt-4 text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load hyperblogs"}
        </div>
      )}
    </>
  );
}
