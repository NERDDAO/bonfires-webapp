"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "filled" | "outline" | "outline-p";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "filled", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center lg:justify-start text-center lg:text-left text-xs rounded-full px-3 py-1 min-h-5 text-white whitespace-nowrap leading-none",
          variant === "filled" && "font-bold bg-dark-s-700",
          variant === "outline" && "border border-[#646464]/50",
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
