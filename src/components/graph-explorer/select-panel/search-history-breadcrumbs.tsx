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
    <div className="border rounded-xl lg:mt-2 px-2 border-[#333333] bg-[#181818] overflow-x-auto scrollbar-hide">
      <div className="breadcrumbs text-xs text-white/90">
        <ul>
          {breadcrumbs.map((crumb, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={crumb.onClick}
                className={cn(
                  "text-[#667085] transition-colors px-2 py-2 lg:py-1",
                  activeBreadcrumb === crumb.label && "text-white! font-medium"
                )}
              >
                {crumb.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
