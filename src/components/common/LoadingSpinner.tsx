/**
 * Loading Spinner Component
 * Displays a loading indicator with optional text
 */

import React from "react";
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

const sizeClasses = {
  xs: "loading-xs",
  sm: "loading-sm",
  md: "loading-md",
  lg: "loading-lg",
};

export function LoadingSpinner({
  size = "md",
  text,
  className,
  center = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <span
      className={cn(
        "loading loading-spinner text-primary",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    />
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
