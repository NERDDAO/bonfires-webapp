/**
 * Skeleton Loader Component
 * Displays placeholder loading states
 */
import React from "react";

import { cn } from "@/lib/cn";

interface SkeletonLoaderProps {
  /** Width of the skeleton */
  width?: number | string;
  /** Height of the skeleton */
  height?: number | string;
  /** Border radius preset */
  radius?: "none" | "sm" | "md" | "lg" | "full";
  /** Additional CSS classes */
  className?: string;
  /** Number of lines for text skeleton */
  lines?: number;
}

const radiusClasses = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

export function SkeletonLoader({
  width,
  height,
  radius = "md",
  className,
  lines,
}: SkeletonLoaderProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height)
    style.height = typeof height === "number" ? `${height}px` : height;

  if (lines) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "skeleton h-4",
              radiusClasses[radius],
              i === lines - 1 && "w-3/4",
              className
            )}
            style={i === lines - 1 ? undefined : style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("skeleton", radiusClasses[radius], className)}
      style={style}
    />
  );
}

/** Pre-built skeleton for cards */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card bg-base-200 animate-pulse", className)}>
      <div className="card-body gap-4">
        <SkeletonLoader height={24} width="60%" />
        <SkeletonLoader lines={3} />
        <div className="flex gap-2 mt-2">
          <SkeletonLoader height={32} width={80} />
          <SkeletonLoader height={32} width={80} />
        </div>
      </div>
    </div>
  );
}

/** Pre-built skeleton for list items */
export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-3", className)}>
      <SkeletonLoader width={40} height={40} radius="full" />
      <div className="flex-1 space-y-2">
        <SkeletonLoader height={16} width="70%" />
        <SkeletonLoader height={12} width="40%" />
      </div>
    </div>
  );
}

export default SkeletonLoader;
