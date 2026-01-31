"use client";

import { useRef } from "react";
import { cubicBezier, motion, useScroll, useSpring, useTransform } from "framer-motion";

import { HEIGHT as STATIC_GRAPH_HEIGHT } from "./static-graph";

type ScrollGraphContainerProps = {
  children: React.ReactNode;
};

export default function ScrollGraphContainer({
  children,
}: ScrollGraphContainerProps) {
  const STATIC_GRAPH_WIDTH = typeof window === "undefined" ? 1920 : window.innerWidth;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Smooth scroll progress so fast scrolls don't cause abrupt jumps
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 30,
    restDelta: 0.001,
  });
  // Near-linear easing so the spring controls the feel; strong curves conflict with smooth progress
  const easePath = cubicBezier(0.33, 0.33, 0.67, 0.67);
  const x = useTransform(
    smoothProgress,
    [0, 0.44, 0.67],
    [(1 / 3) * STATIC_GRAPH_WIDTH, 0, (1 / 2) * STATIC_GRAPH_WIDTH],
    { ease: easePath }
  );
  const y = useTransform(
    smoothProgress,
    [0, 0.44, 0.67],
    [-(2 / 3) * STATIC_GRAPH_HEIGHT, -(1 / 6) * STATIC_GRAPH_HEIGHT, (1 / 2) * STATIC_GRAPH_HEIGHT],
    { ease: easePath }
  );

  return (
    <motion.div
      ref={ref}
      className="relative flex items-center justify-center"
      style={{ minHeight: `max(100dvh, ${STATIC_GRAPH_HEIGHT}px)`, x, y }}
    >
      <figure>{children}</figure>
    </motion.div>
  );
}
