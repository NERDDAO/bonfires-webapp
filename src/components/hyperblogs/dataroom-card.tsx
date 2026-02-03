"use client";

import { DataRoomInfo } from "@/types";

import { cn } from "@/lib/cn";
import { truncateAddress } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import HyperblogFeed from "./hyperblog-feed";

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
  

  if (isLoading) {
    return <DataroomCardSkeleton className={className} variant={variant} />;
  }

  const title = data?.description || "";
  // @TODO: Replace with agent name
  const bonfireName = data?.bonfire_name || "";
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
      <div className="text-[#A9A9A9] text-xs lg:text-sm mb-2 line-clamp-2 shrink-0">
        {bonfireName}
      </div>
      <div className="flex gap-2 flex-wrap">
        <span className=" text-center lg:text-left font-bold text-xs rounded-full px-3 py-1 bg-dark-s-700 text-white whitespace-nowrap">
          {formattedAuthor}
        </span>
        {[
          { value: cost, className: "" },
        ].map((item) => (
          <span
            key={item.value}
            className={cn("text-xs text-center lg:text-left rounded-full px-3 py-1 text-white border border-[#646464]/50 whitespace-nowrap", item.className)}
          >
            {item.value}
          </span>
        ))}
      </div>

      <HyperblogFeed dataroomId={data?.id} />
    </div>
  );
}
