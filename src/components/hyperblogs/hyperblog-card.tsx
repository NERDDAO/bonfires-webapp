import Image from "next/image";
import Link from "next/link";

import { HyperBlogInfo } from "@/types";

import { cn } from "@/lib/cn";
import {
  formatNumber,
  formatReadingTime,
  getTextFromMarkdown,
  truncateAddress,
} from "@/lib/utils";

function HyperBlogCardSkeleton({
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
          <div
            key={i}
            className="h-4 lg:h-[18px] w-12 bg-[#FFFFFF10] rounded"
          />
        ))}
      </div>
    </div>
  );
}

export default function HyperBlogCard({
  data,
  variant = "default",
  isLoading,
  className,
  href,
}: {
  data?: HyperBlogInfo;
  variant?: "default" | "featured";
  isLoading?: boolean;
  className?: string;
  href: string;
}) {
  if (isLoading) {
    return <HyperBlogCardSkeleton className={className} variant={variant} />;
  }

  const title = data?.user_query || "";
  const description = getTextFromMarkdown(data?.preview || "");
  const formattedAuthor = `by ${truncateAddress(data?.author_wallet || "", 4)}`;
  const timestamp = new Date(data?.created_at || "");
  const formattedTimestamp = timestamp.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  const { formattedBlogLength, formattedWordCount, formattedReadingTime } =
    formatReadingTime(data?.word_count || 0);
  const imageSrc = data?.banner_url || "";
  const likes = data?.upvotes || 0;
  const dislikes = data?.downvotes || 0;
  const views = data?.view_count || 0;
  return (
    <Link
      href={href}
      className={cn(
        "rounded-2xl lg:rounded-3xl w-full flex flex-col p-4 lg:p-7.5 bg-[#FFFFFF05] hover:bg-[#FFFFFF0A] cursor-pointer transition-colors duration-300 border-[0.78px] border-[#333333]",
        className
      )}
    >
      <div className="font-bold text-base lg:text-xl capitalize">{title}</div>
      <div className="text-[#A9A9A9] text-xs lg:text-sm mt-1 lg:mt-2 mb-2 line-clamp-2">
        {description}
      </div>
      <div className="flex gap-2 flex-wrap mt-auto">
        <span className="w-full lg:w-auto text-center lg:text-left font-bold text-xs rounded-full px-3 py-1 bg-dark-s-700 text-white whitespace-nowrap">
          {formattedAuthor}
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

      <div
        className={cn(
          "mt-4 relative w-full bg-[#FFFFFF05] rounded-lg border-[0.78px] border-[#333333]",
          variant === "featured" ? "h-18 lg:h-64" : "h-18 lg:h-32"
        )}
      >
        {imageSrc && (
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover rounded-lg"
          />
        )}
      </div>

      <div className="mt-4 flex gap-4 items-center">
        {[
          {
            icon: "/icons/like.svg",
            label: "likes",
            count: likes || 0,
          },
          {
            icon: "/icons/dislike.svg",
            label: "dislikes",
            count: dislikes || 0,
          },
          {
            icon: "/icons/view.svg",
            label: "views",
            count: views || 0,
          },
        ].map((item) => (
          <div key={item.icon} className="flex items-center gap-2 white">
            <Image src={item.icon} alt={item.label} width={18} height={18} />
            <span className="text-xs text-[#828282]">
              {formatNumber(item.count)} {item.label}
            </span>
          </div>
        ))}
      </div>
    </Link>
  );
}
