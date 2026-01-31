"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { usePublicHyperBlogsFeed } from "@/hooks";
import { HyperBlogInfo } from "@/types";

import { calculateReadingTime } from "@/lib/utils";

import { Button } from "../ui/button";
import HyperBlogCard from "./ui/hyperblog-card";

const LOADING_DELAY_MS = 2000;

export default function HyperBlogsPreview() {
  const { data, isLoading, error } = usePublicHyperBlogsFeed({ limit: 5 });

  const [featuredBlogData, setFeaturedBlogData] = useState<
    HyperBlogInfo | undefined
  >(undefined);
  const [latestBlogsData, setLatestBlogsData] = useState<
    { data: HyperBlogInfo; isLoading: boolean }[]
  >(new Array(4).fill({ data: undefined, isLoading: true }));

  useEffect(() => {
    if (data && data.hyperblogs.length > 0) {
      setLatestBlogsData(
        data.hyperblogs
          .slice(1)
          .map((blog) => ({ data: blog, isLoading: false }))
      );
      setFeaturedBlogData(data.hyperblogs[0]);
    }
  }, [data]);

  return (
    <div className="flex flex-col px-20 py-20 min-h-screen">
      <div className="flex flex-col">
        <div className="flex items-center gap-4">
          <div className="font-montserrat text-5xl font-black">Hyperblogs</div>
          <Image
            src="/icons/tooltip.svg"
            alt="Hyperblogs Info"
            width={34}
            height={34}
          />
          <Button variant="primary" className="ml-auto">
            Create your own
          </Button>
        </div>

        <div className="font-laro-soft mt-4">
          Hyperblogs are a long forms information format, which is generated
          from the context of the information already stored in the knowledge
          graph. It’s a way for users to potentially monetize their contributed
          pieces of knowledge.
        </div>

        <div className="font-montserrat text-[2rem] mt-6 font-bold">
          Featured Hyperblog
        </div>

        <HyperBlogCard
          className="mt-4"
          data={featuredBlogData}
          variant="featured"
          isLoading={featuredBlogData === undefined}
        />

        <div className="font-montserrat text-[2rem] mt-6 font-bold">
          Latest Hyperblogs
        </div>

        <div className="mt-4 grid grid-cols-2 gap-6">
          {latestBlogsData.map((blog, index) => (
            <HyperBlogCard
              key={`latest-blog-${index}`}
              data={blog.data}
              isLoading={blog.isLoading}
            />
          ))}
        </div>

        <div className="mt-7 flex gap-6 w-full justify-center">
          <Button variant="primary" className="z-10">
            View More
          </Button>
        </div>
      </div>
    </div>
  );
}
