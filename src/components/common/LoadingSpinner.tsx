/**
 * Loading Spinner Component
 * Displays a loading indicator with optional text
 */
import React from "react";

import Image from "next/image";

import { cn } from "@/lib/cn";

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: "xs" | "sm" | "md" | "lg";
  /** Optional loading text */
  text?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to center the spinner */
  center?: boolean;
}

const sizePixels: Record<"xs" | "sm" | "md" | "lg", number> = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
};

export function LoadingSpinner({
  size = "md",
  text,
  className,
  center = false,
}: LoadingSpinnerProps) {
  const dimension = sizePixels[size];

  const spinner = (
    <span
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={cn("inline-flex shrink-0", className)}
    >
      <Image
        src="/icons/loader-circle.svg"
        height={dimension}
        width={dimension}
        alt=""
        className="animate-spin"
      />
    </span>
  );

  if (text || center) {
    return (
      <div
        className={cn(
          "flex items-center gap-2",
          center && "justify-center w-full h-full"
        )}
      >
        {spinner}
        {text && <span className="text-base-content/70">{text}</span>}
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;
