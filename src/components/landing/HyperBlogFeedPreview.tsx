"use client";

import { usePublicHyperBlogsFeed } from "@/hooks/queries/useHyperBlogsQuery";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { HyperBlogInfo } from "@/types";
import Link from "next/link";

interface HyperBlogCardProps {
  blog: HyperBlogInfo;
}

function HyperBlogCard({ blog }: HyperBlogCardProps) {
  const formattedDate = new Date(blog.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-200 border border-base-content/5">
      {blog.banner_url && (
        <figure className="h-40 overflow-hidden">
          <img
            src={blog.banner_url}
            alt={blog.preview}
            className="w-full h-full object-cover"
          />
        </figure>
      )}
      <div className="card-body p-4">
        <h3 className="card-title text-base line-clamp-2">
          {blog.preview || "Untitled HyperBlog"}
        </h3>
        <div className="flex items-center gap-2 text-sm text-base-content/60 mt-1">
          <span>{formattedDate}</span>
          {blog.word_count && (
            <>
              <span>•</span>
              <span>{blog.word_count.toLocaleString()} words</span>
            </>
          )}
        </div>
        {blog.summary && (
          <p className="text-sm text-base-content/70 mt-2 line-clamp-2">
            {blog.summary}
          </p>
        )}
        <div className="card-actions justify-between items-center mt-3">
          <div className="flex gap-2">
            {blog.taxonomy_keywords?.slice(0, 2).map((keyword) => (
              <span
                key={keyword}
                className="badge badge-outline badge-sm text-xs"
              >
                {keyword}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-base-content/50">
            {blog.view_count !== undefined && (
              <span>{blog.view_count} views</span>
            )}
            {blog.upvotes !== undefined && <span>{blog.upvotes} likes</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

interface HyperBlogFeedPreviewProps {
  limit?: number;
  title?: string;
}

export function HyperBlogFeedPreview({
  limit = 6,
  title = "Latest HyperBlogs",
}: HyperBlogFeedPreviewProps) {
  const { data, isLoading, error } = usePublicHyperBlogsFeed({ limit });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-base-content/60">Unable to load HyperBlogs feed</p>
      </div>
    );
  }

  const hyperblogs = data?.hyperblogs ?? [];

  if (hyperblogs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-base-content/60 text-lg">
          No HyperBlogs published yet
        </p>
        <p className="text-base-content/40 text-sm mt-2">
          Be the first to create AI-generated content from knowledge graphs
        </p>
      </div>
    );
  }

  return (
    <section className="py-8">
      {title && (
        <h2 className="text-2xl font-bold text-center mb-8">{title}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hyperblogs.map((blog) => (
          <Link key={blog.id} href={`/hyperblogs/${blog.id}`} className="block">
            <HyperBlogCard blog={blog} />
          </Link>
        ))}
      </div>
      {hyperblogs.length >= limit && (
        <div className="text-center mt-8">
          <Link
            href="/hyperblogs"
            className="btn btn-outline btn-primary"
          >
            View All HyperBlogs
          </Link>
        </div>
      )}
    </section>
  );
}

export default HyperBlogFeedPreview;
