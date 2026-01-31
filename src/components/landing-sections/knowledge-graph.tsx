"use client";

import { useRef } from "react";

import { knowledgeGraphSectionCopy } from "@/content/landing-page";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

import { Button } from "../ui/button";
import StaticGraph from "./ui/static-graph";

/** Cubic bezier at t: B(t) = (1-t)³P0 + 3(1-t)²t P1 + 3(1-t)t² P2 + t³ P3 */
function cubicBezier(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): { x: number; y: number } {
  const u = 1 - t;
  const u2 = u * u;
  const u3 = u2 * u;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
  };
}

/**
 * S-curve in normalized coords: start (1, 0) top-right, end (1, 0.5) middle-right.
 * First half: curve left then to center; second half: curve left then back to right.
 */
function getPointOnSPath(progress: number): { x: number; y: number } {
  const t = Math.max(0, Math.min(1, progress));
  if (t <= 0.5) {
    const curveT = t * 2;
    return cubicBezier(
      curveT,
      { x: 1, y: 0 },
      { x: 0.843, y: 0.239 },
      { x: 0.566, y: 0.131 },
      { x: 0.517, y: 0.375 }
    );
  }
  const curveT = (t - 0.5) * 2;
  return cubicBezier(
    curveT,
    { x: 0.517, y: 0.375 },
    { x: 0.523, y: 0.592 },
    { x: 0.883, y: 0.563 },
    { x: 1.5, y: 1 }
  );
}
/**
 * S path as SVG d string in normalized 0–1 viewBox (we'll scale with preserveAspectRatio).
 * const S_PATH_D = "M 1 0 C 0.843 0.239 0.566 0.131 0.517 0.375 C 0.523 0.592 0.883 0.563 1 1";
 */

export default function KnowledgeGraph() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { title, subtitle, paragraphs, cta } = knowledgeGraphSectionCopy;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    restDelta: 0.001,
  });

  const pathX = useTransform(smoothProgress, (v) => {
    const p = getPointOnSPath(v);
    return `${(1 - p.x) * 100}%`;
  });
  const pathY = useTransform(smoothProgress, (v) => {
    const p = getPointOnSPath(v);
    return `${p.y * 100}%`;
  });

  return (
    <>
      {/* spacer for graph to be visible in center */}
      <div className="h-[50vh]" />
      
      <div
        ref={sectionRef}
        className="relative flex flex-col px-20 items-start min-h-[calc(100vh)]"
      >
        <div className="flex flex-col max-w-1/2 z-10 my-auto">
          <div className="font-montserrat text-5xl font-black leading-[1.2]">
            {knowledgeGraphSectionCopy.title}
          </div>
          <div className="font-laro-soft text-2xl font-bold mt-6 leading-normal">
            {subtitle}
          </div>

          <div className="flex flex-col gap-8 mt-4">
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
            <Button variant="outline" className="z-10">
              {cta}
            </Button>
          </div>
        </div>

        <div className="absolute right-0 top-[-50vh] w-1/2 h-full pointer-events-none overflow-visible">
          <motion.div
            className="absolute flex items-center justify-end pr-4 pointer-events-auto"
            style={{
              right: pathX,
              top: pathY,
              transform: "translateY(-50%)",
            }}
          >
            <StaticGraph />
          </motion.div>
        </div>
      </div>
    </>
  );
}
