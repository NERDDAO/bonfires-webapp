"use client";

import { useEffect, useState } from "react";

import { hyperblogsPreviewSectionCopy } from "@/content/landing-page";
import { usePublicHyperBlogsFeed } from "@/hooks";
import { HyperBlogInfo } from "@/types";

import HyperBlogCard from "../hyperblogs/hyperblog-card";
import { Button } from "../ui/button";

export default function HyperBlogsPreview() {
  const {
    title,
    tooltipAlt,
    tooltipContent,
    description,
    cta,
    ctaHref,
    featuredBlogTitle,
    latestBlogsTitle,
    viewMoreCtaTitle,
    viewMoreCtaHref,
  } = hyperblogsPreviewSectionCopy;
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
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="font-montserrat text-2xl lg:text-5xl font-black">
            {title}
          </div>
          <div
            className="tooltip tooltip-top flex text-brand-primary"
            data-tip={tooltipContent}
          >
            <svg
              width="35"
              height="35"
              viewBox="0 0 35 35"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="cursor-help h-5 lg:h-8 w-5 lg:w-8"
              aria-label={tooltipAlt}
            >
              <circle cx="17.2651" cy="17.2651" r="15.937" stroke="currentColor" strokeWidth="2.65617"/>
              <path d="M17.1324 23.8745H17.1458" stroke="currentColor" strokeWidth="2.65617" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.2809 13.25C13.5996 12.3717 14.2169 11.6333 15.0248 11.1639C15.8328 10.6945 16.78 10.5241 17.7009 10.6823C18.6218 10.8405 19.4578 11.3174 20.0627 12.0295C20.6676 12.7417 21.0031 13.6437 21.0103 14.5781C21.0103 17.2343 17.0261 18.5624 17.0261 18.5624" stroke="currentColor" strokeWidth="2.65617" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <Button
            variant="primary"
            className="ml-auto hidden lg:block"
            href={ctaHref}
          >
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
