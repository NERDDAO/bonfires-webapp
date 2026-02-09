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

  // return (
  //   <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-white/90 lg:mt-2">
  //     {breadcrumbs.map((crumb, idx) => (
  //       <span key={idx} className="flex items-center gap-x-1.5">
  //         {idx > 0 && <span className="text-white/50">&gt;</span>}
  //         <button
  //           type="button"
  //           onClick={crumb.onClick}
  //           className={cn(
  //             "text-left text-[#667085] hover:text-white hover:underline",
  //             activeBreadcrumb === crumb.label && "text-white font-medium"
  //           )}
  //         >
  //           {crumb.label}
  //         </button>
  //       </span>
  //     ))}
  //   </p>
  // );

  return (
    <p className="text-sm text-white/90 lg:mt-2 leading-loose bg-[#181818] rounded-xl p-2 border border-[#333333]">
      {breadcrumbs.map((crumb, idx) => (
        <span key={idx}>
          {idx > 0 && <span className="text-white/50 mx-2.5">&gt;</span>}
          <span onClick={crumb.onClick}
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
  )
}
