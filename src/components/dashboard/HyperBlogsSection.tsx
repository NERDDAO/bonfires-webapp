/**
 * HyperBlogsSection Component
 *
 * Displays HyperBlogs created by the user.
 * Shows generation status, view count, and quick actions.
 */
"use client";

import Link from "next/link";

import type { HyperBlogInfo } from "@/types/api";
import type { DashboardSectionState } from "@/types/dashboard";

import { DashboardSection } from "./DashboardSection";

/**
 * HyperBlogsSection Component
 *
 * Displays HyperBlogs created by the user.
 * Shows generation status, view count, and quick actions.
 */

interface HyperBlogsSectionProps {
  data: DashboardSectionState<HyperBlogInfo[]>;
  isWalletConnected: boolean;
}

/**
 * Format view count for display
 */
function formatViewCount(count: number | null | undefined): string {
  if (count === null || count === undefined) return "0 views";
  if (count === 1) return "1 view";
  if (count < 1000) return `${count} views`;
  return `${(count / 1000).toFixed(1)}K views`;
}

/**
 * Get status badge for generation status
 */
function getStatusBadge(status: string): { className: string; label: string } {
  switch (status) {
    case "completed":
      return { className: "badge-success", label: "Published" };
    case "generating":
      return { className: "badge-warning", label: "Generating" };
    case "failed":
      return { className: "badge-error", label: "Failed" };
    default:
      return { className: "badge-ghost", label: status };
  }
}

/**
 * HyperBlog Card
 */
function HyperBlogCard({ blog }: { blog: HyperBlogInfo }) {
  const status = getStatusBadge(blog.generation_status);

  return (
    <div className="flex items-center gap-3 p-3 bg-base-300 rounded-lg hover:bg-base-100 transition-colors">
      {/* Banner/Preview */}
      <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center overflow-hidden">
        {blog.banner_url ? (
          <img
            src={blog.banner_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl">📝</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {blog.preview || `HyperBlog ${blog.id.slice(0, 8)}`}
        </p>
        <div className="flex items-center gap-3 text-xs text-base-content/60">
          <span>{formatViewCount(blog.view_count)}</span>
          {blog.word_count && <span>{blog.word_count} words</span>}
          <span className={`badge badge-xs ${status.className}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {blog.generation_status === "completed" && (
          <Link
            href={`/hyperblogs/${blog.id}`}
            className="btn btn-sm btn-primary btn-outline"
          >
            View
          </Link>
        )}
        {blog.generation_status === "failed" && (
          <button className="btn btn-sm btn-error btn-outline">Retry</button>
        )}
        {blog.generation_status === "generating" && (
          <span className="loading loading-spinner loading-sm" />
        )}
      </div>
    </div>
  );
}

/**
 * Wallet connection prompt
 */
function WalletPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-4xl mb-3">🔗</div>
      <h3 className="font-semibold mb-2">Connect Your Wallet</h3>
      <p className="text-sm text-base-content/70 mb-4 max-w-xs">
        Connect your wallet to view your created HyperBlogs.
      </p>
    </div>
  );
}

export function HyperBlogsSection({
  data,
  isWalletConnected,
}: HyperBlogsSectionProps) {
  const blogs = data.data ?? [];
  const isEmpty = !data.isLoading && !data.isError && blogs.length === 0;

  return (
    <DashboardSection
      title="My HyperBlogs"
      icon="📝"
      isLoading={isWalletConnected && data.isLoading}
      isError={isWalletConnected && data.isError}
      errorMessage={data.error?.message ?? "Failed to load HyperBlogs"}
      onRetry={data.refetch}
      isEmpty={isWalletConnected && isEmpty}
      emptyMessage="No HyperBlogs yet. Create one from a Data Room!"
      skeletonRows={3}
      headerAction={
        <Link href="/hyperblogs" className="btn btn-sm btn-primary">
          Browse All
        </Link>
      }
    >
      {!isWalletConnected ? (
        <WalletPrompt />
      ) : (
        <div className="space-y-2">
          {blogs.slice(0, 4).map((blog) => (
            <HyperBlogCard key={blog.id} blog={blog} />
          ))}

          {blogs.length > 4 && (
            <div className="text-center mt-4">
              <Link
                href="/hyperblogs?filter=mine"
                className="link text-base-content text-sm"
              >
                View all {blogs.length} HyperBlogs →
              </Link>
            </div>
          )}
        </div>
      )}
    </DashboardSection>
  );
}
