"use client";

/**
 * HyperBlog Detail Page
 *
 * Displays a single hyperblog with full content when a hyperblog is clicked from the feed.
 * UI matches the expanded hyperblog-card: same badges, banner, footer, plus summary and full content.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import type { HyperBlogInfo } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/cn";
import { formatNumber, formatReadingTime, truncateAddress } from "@/lib/utils";

export default function HyperBlogDetailPage() {
  const params = useParams();
  const hyperblogId = params["hyperblogId"] as string;

  const [blog, setBlog] = useState<HyperBlogInfo | null>(null);
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /** Strip HTML tags so markdown renders only markdown; ignores raw HTML. */
  const stripHtml = useCallback(
    (text: string) => text.replace(/<\/?[a-zA-Z][^>]*>/g, ""),
    []
  );

  const extractViewContent = useCallback(
    (viewData: Record<string, unknown>): string | null => {
      const raw =
        (viewData["content"] as string | undefined) ??
        (viewData["full_content"] as string | undefined) ??
        (viewData["html"] as string | undefined) ??
        (viewData["markdown"] as string | undefined) ??
        (viewData["body"] as string | undefined) ??
        (viewData["data"] &&
          typeof viewData["data"] === "object" &&
          ((viewData["data"] as Record<string, unknown>)["content"] as
            | string
            | undefined));
      return typeof raw === "string" && raw.trim() ? raw : null;
    },
    []
  );

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
      console.log("data", data);
      setBlog(data);

      if (data.generation_status === "completed") {
        // @TODO: record a view
        // await fetch(`/api/hyperblogs/${hyperblogId}/view`, );
        if (data.blog_content?.formatted_content) {
          setFullContent(stripHtml(data.blog_content.formatted_content));
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch blog";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [hyperblogId, extractViewContent]);

  useEffect(() => {
    if (hyperblogId) {
      fetchBlog();
    }
  }, [hyperblogId, fetchBlog]);

  // Poll for completion when blog is still generating
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (blog?.generation_status !== "generating") {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const pollForCompletion = async () => {
      try {
        const response = await fetch(`/api/hyperblogs/${hyperblogId}`);
        if (!response.ok) return;
        const data: HyperBlogInfo = await response.json();
        setBlog(data);
        if (data.generation_status === "completed") {
          if (data.blog_content?.formatted_content) {
            setFullContent(stripHtml(data.blog_content.formatted_content));
          }
        }
      } catch {
        // Silently ignore poll errors; next poll will retry
      }
    };

    pollIntervalRef.current = setInterval(pollForCompletion, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [blog?.generation_status, hyperblogId, stripHtml]);

  const layoutClass =
    "flex flex-col items-center px-4 sm:px-6 lg:px-8 py-7 lg:py-18 min-h-screen w-full";
  const contentMaxWidth = "w-full max-w-4xl";
  const cardClass =
    "rounded-2xl lg:rounded-3xl w-full flex flex-col p-4 lg:p-7.5 bg-[#FFFFFF05] border-[0.78px] border-[#333333]";

  // Loading state
  if (isLoading) {
    return (
      <main className={cn(layoutClass)}>
        <div className={cn(contentMaxWidth, "flex flex-col items-center")}>
          <Link
            href="/hyperblogs"
            className="text-sm text-[#A9A9A9] hover:text-white mb-6 inline-flex items-center gap-1 transition-colors w-fit self-start"
          >
            ← Back to Feed
          </Link>
          <div className={cn(cardClass, "animate-pulse")}>
            <div className="h-4 lg:h-7 w-3/4 bg-[#FFFFFF15] rounded" />
            <div className="h-8 lg:h-10 w-full bg-[#FFFFFF10] rounded mt-1 lg:mt-2 mb-2" />
            <div className="flex gap-2 flex-wrap items-center">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="h-5 lg:h-6 w-20 bg-[#FFFFFF15] rounded-full shrink-0"
                />
              ))}
            </div>
            <div className="mt-4 w-full h-32 lg:h-64 bg-[#FFFFFF10] rounded-lg border-[0.78px] border-[#333333]" />
            <div className="mt-4 flex gap-4 items-center">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 w-12 bg-[#FFFFFF10] rounded" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error && !blog) {
    return (
      <main className={cn(layoutClass)}>
        <div className={cn(contentMaxWidth, "flex flex-col items-center")}>
          <Link
            href="/hyperblogs"
            className="text-sm text-[#A9A9A9] hover:text-white mb-6 inline-flex items-center gap-1 transition-colors w-fit self-start"
          >
            ← Back to Feed
          </Link>
          <div
            className={cn(
              "w-full rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            )}
          >
            <div className="flex-1">
              <h3 className="font-bold text-white">Error loading blog</h3>
              <p className="text-sm text-[#A9A9A9] mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchBlog}
              className="text-sm font-medium text-white border border-[#646464]/50 rounded-lg px-3 py-2 hover:bg-[#FFFFFF08] transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!blog) {
    return null;
  }

  const formattedAuthor = `by ${truncateAddress(blog.author_wallet, 4)}`;
  const timestamp = new Date(blog.created_at);
  const formattedTimestamp = timestamp.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  const { formattedBlogLength, formattedWordCount, formattedReadingTime } =
    formatReadingTime(blog.word_count || 0);
  const likes = blog.upvotes ?? 0;
  const dislikes = blog.downvotes ?? 0;
  const views = blog.view_count ?? 0;

  return (
    <main className={cn(layoutClass)}>
      <div className={cn(contentMaxWidth, "flex flex-col items-center")}>
        <Link
          href="/hyperblogs"
          className="text-sm text-[#A9A9A9] hover:text-white mb-6 inline-flex items-center gap-1 transition-colors w-fit self-start"
        >
          ← Back to Feed
        </Link>

        <div className={cn(cardClass)}>
          {/* Banner - same as hyperblog-card */}
          <div
            className={cn(
              "mb-4 relative w-full bg-[#FFFFFF05] rounded-lg border-[0.78px] border-[#333333]",
              "min-h-32 lg:min-h-64"
            )}
          >
            {blog.banner_url && (
              <Image
                src={blog.banner_url}
                alt={blog.user_query}
                fill
                className="object-cover rounded-lg"
              />
            )}
          </div>

          {/* Title - same as card (expanded: larger) */}
          <h1 className="font-bold text-2xl lg:text-3xl capitalize text-white">
            {blog.user_query}
          </h1>

          {/* Badges row - same as hyperblog-card */}
          <div className="flex gap-2 flex-wrap mt-1 lg:mt-2 mb-2">
            <span className="w-full lg:w-auto text-center lg:text-left font-bold text-xs rounded-full px-3 py-1 bg-dark-s-700 text-white whitespace-nowrap">
              {blog.author_name ? `by ${blog.author_name}` : formattedAuthor}
            </span>
            {[
              {
                value: formattedTimestamp,
                className: "w-full lg:w-auto flex-auto",
              },
              { value: formattedBlogLength, className: "" },
              { value: formattedWordCount, className: "" },
              { value: formattedReadingTime, className: "" },
            ].map((item) => (
              <span
                key={item.value}
                className={cn(
                  "text-xs text-center flex-1 lg:flex-none lg:text-left rounded-full px-3 py-1 text-white border border-[#646464]/50 whitespace-nowrap",
                  item.className
                )}
              >
                {item.value}
              </span>
            ))}
          </div>

          {/* Status banners for non-complete */}
          {blog.generation_status === "generating" && (
            <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center gap-3">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              <span className="text-amber-200 text-sm">
                This blog is still being generated. Please check back in a few
                moments.
              </span>
            </div>
          )}

          {blog.generation_status === "failed" && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <span className="text-red-200 text-sm">
                Blog generation failed. Please try again later.
              </span>
            </div>
          )}

          {/* Summary - keep as currently shown */}
          {blog.summary && (
            <div className="mt-6 rounded-xl bg-[#FFFFFF08] border border-[#333333] p-6">
              <h3 className="font-semibold text-lg text-white mb-2">Summary</h3>
              <p className="text-[#A9A9A9]">{blog.summary}</p>
            </div>
          )}

          {/* Taxonomy keywords - same badge style as card */}
          {blog.taxonomy_keywords && blog.taxonomy_keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {blog.taxonomy_keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="text-xs rounded-full px-3 py-1 text-white border border-[#646464]/50"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}

          {/* Full content or preview (markdown rendered) */}
          <article className="mt-6">
            {fullContent ? (
              <div className="blog-content text-[#A9A9A9] leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="my-6 leading-relaxed text-[#A9A9A9]">
                        {children}
                      </p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="mt-8 mb-4 text-2xl font-semibold tracking-tight text-white">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mt-6 mb-3 text-xl font-semibold tracking-tight text-white">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mt-5 mb-2 text-lg font-semibold tracking-tight text-white">
                        {children}
                      </h3>
                    ),
                    ul: ({ children }) => (
                      <ul className="my-4 list-disc pl-6 [&>li]:my-1 [&_::marker]:text-[#646464]">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="my-4 list-decimal pl-6 [&>li]:my-1 [&_::marker]:text-[#646464]">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="my-1 text-[#A9A9A9]">{children}</li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 border-l-4 border-[#646464]/50 pl-4 italic text-[#A9A9A9]">
                        {children}
                      </blockquote>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-white/90 underline hover:text-white"
                      >
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-white">
                        {children}
                      </strong>
                    ),
                    code: ({ className, children }) =>
                      className ? (
                        <code
                          className={cn(
                            className,
                            "block overflow-x-auto rounded border border-[#333333] bg-[#FFFFFF08] p-4 text-sm text-[#A9A9A9]"
                          )}
                        >
                          {children}
                        </code>
                      ) : (
                        <code className="rounded bg-[#FFFFFF08] px-1.5 py-0.5 text-[#A9A9A9]">
                          {children}
                        </code>
                      ),
                    pre: ({ children }) => (
                      <pre className="my-4 overflow-x-auto rounded border border-[#333333] bg-[#FFFFFF08] p-4 text-sm text-[#A9A9A9]">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {fullContent}
                </ReactMarkdown>
              </div>
            ) : blog.preview ? (
              <div className="text-[#A9A9A9] whitespace-pre-wrap">
                <p>{blog.preview}</p>
                {blog.generation_status === "completed" && (
                  <p className="text-sm opacity-70 mt-4 italic">
                    Full content loading…
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[#A9A9A9]/60 italic">No content available.</p>
            )}
          </article>

          {/* Footer - same as hyperblog-card (like, dislike, view icons) */}
          <div className="mt-6 pt-4 border-t border-[#333333] flex gap-4 items-center flex-wrap">
            {[
              { icon: "/icons/like.svg", label: "likes", count: likes },
              {
                icon: "/icons/dislike.svg",
                label: "dislikes",
                count: dislikes,
              },
              { icon: "/icons/view.svg", label: "views", count: views },
            ].map((item) => (
              <div key={item.icon} className="flex items-center gap-2">
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={18}
                  height={18}
                />
                <span className="text-xs text-[#828282]">
                  {formatNumber(item.count)} {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
