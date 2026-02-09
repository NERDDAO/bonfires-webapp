"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "filled" | "outline";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "filled", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "text-center lg:text-left text-xs rounded-full px-3 py-1 text-white whitespace-nowrap",
          variant === "filled" &&
            "font-bold bg-dark-s-700",
          variant === "outline" &&
            "border border-[#646464]/50",
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
