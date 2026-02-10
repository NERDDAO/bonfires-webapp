"use client";

import { cn } from "@/lib/cn";

export interface SearchHistoryBreadcrumbsProps {
  activeBreadcrumb: string | null;
  breadcrumbs: { label: string; onClick: () => void }[];
}

export function SearchHistoryBreadcrumbs({
  activeBreadcrumb,
  breadcrumbs,
}: SearchHistoryBreadcrumbsProps) {
  if (breadcrumbs.length === 0) return null;

  return (
    <p className="text-sm text-white/90 lg:mt-2 leading-loose bg-[#181818] rounded-xl px-2 border border-[#333333] py-3 lg:py-2 overflow-x-auto lg:overflow-x-hidden scrollbar-hide whitespace-nowrap lg:whitespace-normal">
      {breadcrumbs.map((crumb, idx) => (
        <span key={idx}>
          {idx > 0 && <span className="text-white/50 mx-2.5">&gt;</span>}
          <span
            onClick={crumb.onClick}
            className={cn(
              "cursor-pointer",
              "text-left text-[#667085] hover:text-white",
              activeBreadcrumb === crumb.label && "text-white font-medium"
            )}
          >
            {crumb.label}
          </span>
        </span>
      ))}
    </p>
  );
}
