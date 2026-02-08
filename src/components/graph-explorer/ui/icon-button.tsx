"use client";

/**
 * IconButton
 *
 * Shared icon-only button for graph-explorer (zoom, search, episodes, etc.).
 * Matches force-graph zoom control styling.
 */
import { cn } from "@/lib/cn";

const iconButtonClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded border-0 bg-transparent text-neutral-200 transition hover:bg-neutral-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-neutral-500";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label (required for icon-only buttons) */
  "aria-label": string;
  /** Optional tooltip */
  title?: string;
  /** Icon content (e.g. Image, SVG, or text like "+") */
  children: React.ReactNode;
  className?: string;
}

export function IconButton({
  children,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button type={type} className={cn(iconButtonClass, className)} {...rest}>
      {children}
    </button>
  );
}
