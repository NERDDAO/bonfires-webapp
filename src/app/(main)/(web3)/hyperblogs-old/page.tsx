"use client";

/**
 * HyperBlogs Feed Page
 *
 * Displays a feed of all public hyperblogs from all data rooms.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";

import type { HyperBlogInfo, HyperBlogListResponse } from "@/types";

import { Header } from "@/components/shared/Header";

import {
  calculateReadingTime,
  formatTimestamp,
  truncateAddress,
  truncatePreviewSmart,
} from "@/lib/utils";

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <Header />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function HyperBlogsPage() {
  const [blogs, setBlogs] = useState<HyperBlogInfo[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentOffset, setCurrentOffset] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const blogsRef = useRef<HyperBlogInfo[]>([]);

  useEffect(() => {
    blogsRef.current = blogs;
  }, [blogs]);

  const fetchBlogs = useCallback(async (offset: number, append: boolean) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetch(`/api/hyperblogs?limit=20&offset=${offset}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data: HyperBlogListResponse = await response.json();

      if (append) {
        const existingIds = new Set(blogsRef.current.map((b) => b.id));
        const newBlogs = data.hyperblogs.filter((b) => !existingIds.has(b.id));
        setBlogs((prev) => [...prev, ...newBlogs]);
      } else {
        setBlogs(data.hyperblogs);
      }

      setTotalCount(data.count);
      setCurrentOffset(offset);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load blogs";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs(0, false);
  }, [fetchBlogs]);

  const handleLoadMore = () => {
    const nextOffset = currentOffset + 20;
    fetchBlogs(nextOffset, true);
  };

  const handleRetry = () => {
    setError(null);
    fetchBlogs(0, false);
  };

  const hasMore = blogs.length < totalCount;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "generating":
        return (
          <span className="badge badge-warning gap-1">
            <span className="loading loading-spinner loading-xs"></span>
            Generating
          </span>
        );
      case "completed":
        return <span className="badge badge-success gap-1">✓ Completed</span>;
      case "failed":
        return <span className="badge badge-error gap-1">✗ Failed</span>;
      default:
        return <span className="badge badge-ghost gap-1">{status}</span>;
    }
  };

  // Loading state
  if (isLoading && blogs.length === 0) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">HyperBlogs</h1>
            <p className="text-base-content/70">
              AI-generated blog posts from knowledge graphs
            </p>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 w-full"></div>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error && blogs.length === 0) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">HyperBlogs</h1>
            <p className="text-base-content/70">
              AI-generated blog posts from knowledge graphs
            </p>
          </div>
          <div className="alert alert-error">
            <span>{error}</span>
            <button className="btn btn-sm btn-primary" onClick={handleRetry}>
              Retry
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // Empty state
  if (blogs.length === 0 && !isLoading) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">HyperBlogs</h1>
            <p className="text-base-content/70">
              AI-generated blog posts from knowledge graphs
            </p>
          </div>
          <div className="text-center py-12 opacity-70">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-lg">
              No public blogs available yet. Visit a DataRoom to create one!
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">HyperBlogs</h1>
            <p className="text-base-content/70">
              AI-generated blog posts from knowledge graphs
            </p>
            {totalCount > 0 && (
              <div className="mt-2 text-sm opacity-70">
                {totalCount} blog{totalCount !== 1 ? "s" : ""} available
              </div>
            )}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => fetchBlogs(0, false)}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              "🔄"
            )}
            Refresh
          </button>
        </div>

        {/* Blog List */}
        <div className="space-y-6">
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/hyperblogs/${blog.id}`}
              className="block no-underline group"
            >
              <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body">
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(blog.generation_status)}
                  </div>

                  {/* Title */}
                  <h2 className="card-title text-xl font-bold pr-24 group-hover:text-primary transition-colors">
                    {blog.user_query}
                  </h2>

                  {/* Preview */}
                  <p className="text-base-content/80 line-clamp-3">
                    {blog.summary || truncatePreviewSmart(blog.preview, 200)}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/60 mt-4">
                    <span className="font-medium">
                      by{" "}
                      {blog.author_name ||
                        truncateAddress(blog.author_wallet, 6)}
                    </span>
                    <span>•</span>
                    <span>{formatTimestamp(blog.created_at)}</span>
                    {blog.blog_length && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{blog.blog_length}</span>
                      </>
                    )}
                    {blog.generation_status === "completed" &&
                      blog.word_count && (
                        <>
                          <span>•</span>
                          <span>{blog.word_count} words</span>
                          <span>•</span>
                          <span>{calculateReadingTime(blog.word_count)}</span>
                        </>
                      )}
                  </div>

                  {/* Tags */}
                  {blog.taxonomy_keywords &&
                    blog.taxonomy_keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {blog.taxonomy_keywords
                          .slice(0, 5)
                          .map((keyword, idx) => (
                            <span
                              key={idx}
                              className="badge badge-primary badge-sm"
                            >
                              {keyword}
                            </span>
                          ))}
                        {blog.taxonomy_keywords.length > 5 && (
                          <span className="badge badge-ghost badge-sm">
                            +{blog.taxonomy_keywords.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                  {/* Stats */}
                  {blog.generation_status === "completed" && (
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-base-content/5 text-base-content/60">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span>👍</span>
                        <span>{blog.upvotes || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span>👎</span>
                        <span>{blog.downvotes || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span>💬</span>
                        <span>{blog.comment_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm ml-auto">
                        <span>👁</span>
                        <span>{blog.view_count || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="mt-8 space-y-2">
            <button
              className="btn btn-outline btn-block"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </button>
            <div className="text-center text-sm opacity-70">
              Showing {blogs.length} of {totalCount}
            </div>
          </div>
        )}

        {/* All Loaded */}
        {!hasMore && blogs.length > 0 && (
          <div className="text-center text-sm opacity-70 py-8">
            All blogs loaded ({totalCount} total)
          </div>
        )}
      </div>
    </PageShell>
  );
}
