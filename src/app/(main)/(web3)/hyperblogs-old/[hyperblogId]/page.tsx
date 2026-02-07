"use client";

/**
 * HyperBlog Detail Page
 *
 * Displays a single hyperblog with full content.
 */
import { useCallback, useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import type { HyperBlogInfo } from "@/types";

import {
  calculateReadingTime,
  formatTimestamp,
  truncateAddress,
} from "@/lib/utils";

export default function HyperBlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hyperblogId = params["hyperblogId"] as string;

  const [blog, setBlog] = useState<HyperBlogInfo | null>(null);
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/hyperblogs/${hyperblogId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const data: HyperBlogInfo = await response.json();
      setBlog(data);

      // Fetch full content if completed
      if (data.generation_status === "completed") {
        const viewResponse = await fetch(`/api/hyperblogs/${hyperblogId}/view`);
        if (viewResponse.ok) {
          const viewData = await viewResponse.json();
          setFullContent(viewData.content || viewData.full_content || null);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch blog";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [hyperblogId]);

  useEffect(() => {
    if (hyperblogId) {
      fetchBlog();
    }
  }, [hyperblogId, fetchBlog]);

  const handleBack = () => {
    router.push("/hyperblogs");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button onClick={handleBack} className="btn btn-ghost btn-sm mb-6">
          ← Back to Feed
        </button>
        <div className="skeleton h-12 w-3/4 mb-4"></div>
        <div className="skeleton h-4 w-1/4 mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-4 w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !blog) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button onClick={handleBack} className="btn btn-ghost btn-sm mb-6">
          ← Back to Feed
        </button>
        <div className="alert alert-error shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Error loading blog</h3>
            <div className="text-sm">{error}</div>
          </div>
          <button onClick={fetchBlog} className="btn btn-sm btn-ghost">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <button onClick={handleBack} className="btn btn-ghost btn-sm mb-6">
        ← Back to Feed
      </button>

      {/* Banner Image */}
      {blog.banner_url && (
        <div className="mb-8 rounded-xl overflow-hidden">
          <img
            src={blog.banner_url}
            alt={blog.user_query}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Header */}
      <article className="prose prose-lg max-w-none">
        {/* Title */}
        <h1 className="text-4xl font-bold mb-4">{blog.user_query}</h1>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/60 mb-8 not-prose">
          <span className="font-medium">
            by {blog.author_name || truncateAddress(blog.author_wallet, 6)}
          </span>
          <span>•</span>
          <span>{formatTimestamp(blog.created_at)}</span>
          {blog.blog_length && (
            <>
              <span>•</span>
              <span className="capitalize">{blog.blog_length}</span>
            </>
          )}
          {blog.word_count && (
            <>
              <span>•</span>
              <span>{blog.word_count} words</span>
              <span>•</span>
              <span>{calculateReadingTime(blog.word_count)}</span>
            </>
          )}
        </div>

        {/* Status Banner for Non-Complete */}
        {blog.generation_status === "generating" && (
          <div className="alert alert-warning mb-8 not-prose">
            <span className="loading loading-spinner loading-sm"></span>
            <span>
              This blog is still being generated. Please check back in a few
              moments.
            </span>
          </div>
        )}

        {blog.generation_status === "failed" && (
          <div className="alert alert-error mb-8 not-prose">
            <span>Blog generation failed. Please try again later.</span>
          </div>
        )}

        {/* Summary */}
        {blog.summary && (
          <div className="bg-base-200 p-6 rounded-xl mb-8 not-prose">
            <h3 className="font-semibold mb-2 text-lg">Summary</h3>
            <p className="text-base-content/80">{blog.summary}</p>
          </div>
        )}

        {/* Tags */}
        {blog.taxonomy_keywords && blog.taxonomy_keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 not-prose">
            {blog.taxonomy_keywords.map((keyword, idx) => (
              <span key={idx} className="badge badge-primary">
                {keyword}
              </span>
            ))}
          </div>
        )}

        {/* Full Content */}
        {fullContent ? (
          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: fullContent }}
          />
        ) : blog.preview ? (
          <div className="text-base-content/80">
            <p>{blog.preview}</p>
            {blog.generation_status === "completed" && (
              <p className="text-sm opacity-70 mt-4 italic">
                Full content loading...
              </p>
            )}
          </div>
        ) : (
          <p className="text-base-content/60 italic">No content available.</p>
        )}
      </article>

      {/* Stats Footer */}
      {blog.generation_status === "completed" && (
        <div className="flex items-center gap-6 mt-12 pt-6 border-t border-base-content/10 text-base-content/60">
          <div className="flex items-center gap-2">
            <span>👍</span>
            <span>{blog.upvotes || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👎</span>
            <span>{blog.downvotes || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💬</span>
            <span>{blog.comment_count || 0} comments</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span>👁</span>
            <span>{blog.view_count || 0} views</span>
          </div>
        </div>
      )}
    </div>
  );
}
