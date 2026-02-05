"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { usePublicHyperBlogsFeed } from "@/hooks";
import { HyperBlogInfo } from "@/types";

import { Button } from "../ui/button";
import HyperBlogCard from "../hyperblogs/hyperblog-card";
import { hyperblogsPreviewSectionCopy } from "@/content/landing-page";

export default function HyperBlogsPreview() {
  const { title, tooltipIcon, tooltipAlt, description, cta, ctaHref, featuredBlogTitle, latestBlogsTitle, viewMoreCtaTitle, viewMoreCtaHref } = hyperblogsPreviewSectionCopy;
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
    <div className="flex flex-col px-6 lg:px-20 py-7 lg:py-20 min-h-svh lg:min-h-screen">
      <div className="flex flex-col">
        <div className="flex items-center gap-4">
          <div className="font-montserrat text-2xl lg:text-5xl font-black">{title}</div>
          <Image
            src={tooltipIcon}
            alt={tooltipAlt}
            width={34}
            height={34}
            className="hidden lg:block"
          />
          <Button variant="primary" className="ml-auto hidden lg:block" href={ctaHref}>
            {cta}
          </Button>
        </div>

        <div className="font-laro-soft mt-2 lg:mt-4 text-sm lg:text-base">
          {description}
        </div>

        <Button variant="primary" className="mt-7 lg:hidden" href={ctaHref}>
          {cta}
        </Button>

        <div className="font-montserrat text-lg lg:text-[2rem] mt-10 lg:mt-6 font-black lg:font-bold">
          {featuredBlogTitle}
        </div>

        <HyperBlogCard
          className="mt-4"
          data={featuredBlogData}
          variant="featured"
          isLoading={featuredBlogData === undefined}
          href={`/hyperblogs/${featuredBlogData?.id}`}
        />

        <div className="font-montserrat text-lg lg:text-[2rem] mt-6 font-bold">
          {latestBlogsTitle}
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {latestBlogsData.map((blog, index) => (
            <HyperBlogCard
              key={`latest-blog-${index}`}
              data={blog.data}
              isLoading={blog.isLoading}
              href={`/hyperblogs/${blog.data?.id}`}
            />
          ))}
        </div>

        <div className="mt-7 flex gap-6 w-full justify-center">
          <Button variant="primary" className="z-10" href={viewMoreCtaHref}>
            {viewMoreCtaTitle}
          </Button>
        </div>
      </div>
    </div>
  );
}
