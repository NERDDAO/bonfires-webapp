"use client";

import { useRef } from "react";

import { knowledgeGraphSectionCopy } from "@/content/landing-page";

import { useIsMobile } from "@/hooks/useMediaQuery";

import { cn } from "@/lib/cn";

import { Button } from "../ui/button";
import StaticGraph from "./ui/static-graph";

export default function KnowledgeGraph() {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const { title, subtitle, description, paragraphs, cta, ctaHref } =
    knowledgeGraphSectionCopy;

  return (
    <div
      ref={sectionRef}
      className="relative flex flex-col px-7 lg:px-20 py-9 lg:py-0 lg:items-start min-h-[calc(100svh-4rem)] lg:min-h-[calc(100dvh-5rem)]"
    >
      <div className="flex flex-col lg:max-w-1/2 z-10 lg:my-auto">
        <div className="font-montserrat text-2xl lg:text-5xl font-black leading-[1.2]">
          {title}
        </div>
        <div className="hidden lg:block font-laro-soft text-2xl font-bold mt-6 leading-normal">
          {subtitle}
        </div>
        <div className="block lg:hidden font-laro-soft text-sm mt-2">
          {description}
        </div>

        <div className="hidden lg:flex flex-col gap-8 mt-4">
          {paragraphs.map((paragraph) => (
            <div key={paragraph.heading}>
              <div className="font-montserrat text-2xl font-black">
                {paragraph.heading}
              </div>
              <div className="font-laro-soft">{paragraph.description}</div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex gap-6">
          <Button variant="outline" className="z-10" href={ctaHref}>
            {cta}
          </Button>
        </div>
      </div>

      <div className="absolute bottom-0 lg:bottom-auto left-0 lg:left-auto lg:right-0 lg:top-[-50vh] w-full lg:w-1/2 lg:h-full pointer-events-none overflow-visible">
        <div
          className={cn(
            "absolute bottom-0 flex items-center justify-center pointer-events-auto",
            isMobile
              ? "left-1/2 -translate-x-1/2"
              : "bottom-0 right-0 translate-x-1/3 translate-y-1/2"
          )}
        >
          <StaticGraph />
        </div>
      </div>
    </div>
  );
}
