"use client";

import { useState } from "react";

import { DataRoomInfo } from "@/types";

import { cn } from "@/lib/cn";
import { truncateAddress } from "@/lib/utils";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CreateBlogModal } from "./create-blog";
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
      <div className="h-4 lg:h-7 w-full bg-[#FFFFFF10] rounded mt-1 lg:mt-2 mb-2" />
      {/* Badges row: matches actual card */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant="filled"
          className="h-5 lg:h-6 w-full lg:w-24 bg-[#FFFFFF15] border-0 text-transparent shrink-0"
        >
          {" "}
        </Badge>
        <Badge
          variant="outline"
          className="h-5 lg:h-6 w-full lg:w-28 bg-[#FFFFFF15] border-0 text-transparent shrink-0"
        >
          {" "}
        </Badge>
      </div>
      {/* HyperblogFeed placeholder: "Show existing blogs" button area */}
      <div className="mt-4 w-full rounded-lg min-h-17 bg-[#FFFFFF10] border-[0.78px] border-[#333333]" />
      {/* Buttons row: Explore Graph + Create Blog */}
      <div className="mt-4 flex gap-4">
        <div className="flex-1 h-10 rounded-lg bg-[#FFFFFF10] border-[0.78px] border-[#333333]" />
        <div className="flex-1 h-10 rounded-lg bg-[#FFFFFF10] border-[0.78px] border-[#333333]" />
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
  const [createBlogOpen, setCreateBlogOpen] = useState(false);

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
        <Badge variant="filled">{formattedAuthor}</Badge>
        <Badge variant="outline">{cost}</Badge>
      </div>

      <HyperblogFeed dataroomId={data?.id} />

      <div className="mt-4 flex gap-4">
        <Button showElevation={false} variant="outline" className="flex-1">
          Explore Graph
        </Button>
        <Button
          showElevation={false}
          variant="primary"
          className="flex-1"
          onClick={() => setCreateBlogOpen(true)}
        >
          Create Blog
        </Button>
      </div>

      <CreateBlogModal
        isOpen={createBlogOpen}
        onClose={() => setCreateBlogOpen(false)}
        dataroomId={data?.id ?? ""}
        dataroomTitle={data?.description}
        dataroomPriceUsd={data?.price_usd}
        onSuccess={() => setCreateBlogOpen(false)}
      />
    </div>
  );
}
