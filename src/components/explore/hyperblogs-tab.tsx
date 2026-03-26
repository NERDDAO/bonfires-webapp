"use client";

import { useEffect, useMemo, useRef } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";

import { useSubdomainBonfire } from "@/contexts/SubdomainBonfireContext";
import { usePublicHyperBlogsInfiniteQuery } from "@/hooks/queries/useHyperBlogsQuery";
import type { HyperBlogInfo } from "@/types";
import HyperBlogCard from "@/components/hyperblogs/hyperblog-card";

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

interface HyperBlogsTabProps {
  search: string;
}

export default function HyperBlogsTab({ search }: HyperBlogsTabProps) {
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();
  const bonfireId = isSubdomainScoped ? subdomainConfig?.bonfireId : undefined;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isError, error } =
    usePublicHyperBlogsInfiniteQuery({
      bonfireId,
      sortBy: "upvotes",
      pageSize: PAGE_SIZE,
    });

  // Flatten all pages into a single array — response shape is { hyperblogs: HyperBlogInfo[] }
  const allBlogs: HyperBlogInfo[] = useMemo(
    () =>
      data?.pages.flatMap(
        (page: { hyperblogs: HyperBlogInfo[] }) => page.hyperblogs,
      ) ?? [],
    [data],
  );

  const placeholderCount = isFetchingNextPage ? PAGE_SIZE : 0;

  // Fuse search
  const fuse = useMemo(() => new Fuse(allBlogs, FUSE_OPTIONS), [allBlogs]);
  const filtered: HyperBlogInfo[] = useMemo(() => {
    const trimmed = search.trim();
    if (!trimmed) return allBlogs;
    return fuse.search(trimmed).map((r) => r.item);
  }, [allBlogs, fuse, search]);

  const totalCount = filtered.length + placeholderCount;

  // Infinite scroll sentinel
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
      <div className="mt-4 flex flex-col gap-4 max-w-2xl mx-auto w-full">
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
