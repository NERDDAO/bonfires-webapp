"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { AggregatedSubmission } from "@/types";
import { useLeaderboard } from "@/hooks";

type SortKey = "weighted_score" | "community_votes" | "recent";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "weighted_score", label: "AI Score" },
  { key: "community_votes", label: "Votes" },
  { key: "recent", label: "Newest" },
];

function truncateWallet(wallet: string): string {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

interface LeaderboardTableProps {
  trackId: string;
  className?: string;
}

export default function LeaderboardTable({ trackId, className }: LeaderboardTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>("weighted_score");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useLeaderboard(trackId, sortBy, page);

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className={cn("", className)}>
      {/* Sort controls */}
      <div className="flex items-center gap-1.5 mb-4">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => { setSortBy(opt.key); setPage(1); }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              sortBy === opt.key
                ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/40"
                : "bg-[#FFFFFF08] text-dark-s-60 border border-transparent hover:border-[#444444]",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-dark-s-80 text-xs border-b border-[#333333]">
              <th className="text-left py-2 pr-3 w-12">#</th>
              <th className="text-left py-2 pr-3">Project</th>
              <th className="text-left py-2 pr-3">Wallet</th>
              <th className="text-right py-2 pr-3">Score</th>
              <th className="text-right py-2 pr-3">Votes</th>
              <th className="text-right py-2">Reviews</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }, (_, i) => (
                  <tr key={`skel-${i}`} className="border-b border-[#222222] animate-pulse">
                    <td className="py-3 pr-3"><div className="h-4 w-6 bg-[#FFFFFF15] rounded" /></td>
                    <td className="py-3 pr-3"><div className="h-4 w-40 bg-[#FFFFFF15] rounded" /></td>
                    <td className="py-3 pr-3"><div className="h-4 w-24 bg-[#FFFFFF10] rounded" /></td>
                    <td className="py-3 pr-3"><div className="h-4 w-10 bg-[#FFFFFF10] rounded ml-auto" /></td>
                    <td className="py-3 pr-3"><div className="h-4 w-8 bg-[#FFFFFF10] rounded ml-auto" /></td>
                    <td className="py-3"><div className="h-4 w-12 bg-[#FFFFFF10] rounded ml-auto" /></td>
                  </tr>
                ))
              : entries.map((entry, idx) => (
                  <tr
                    key={entry.wallet}
                    className="border-b border-[#222222] hover:bg-[#FFFFFF05] transition-colors"
                  >
                    <td className="py-3 pr-3 text-dark-s-80 font-mono">
                      {(page - 1) * 20 + idx + 1}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="text-dark-s-0 font-medium">
                        {entry.latest_hyperblog_title ?? "Untitled"}
                      </span>
                      {entry.project_url && (
                        <span className="block text-xs text-dark-s-80 truncate max-w-[200px]">
                          {entry.project_url}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-dark-s-60 font-mono text-xs">
                      {truncateWallet(entry.wallet)}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      {entry.weighted_score != null ? (
                        <span className="text-dark-s-0 font-semibold">
                          {entry.weighted_score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-dark-s-80">--</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-right text-dark-s-60">
                      {entry.total_votes}
                    </td>
                    <td className="py-3 text-right text-dark-s-80 text-xs">
                      {entry.review_count}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs text-dark-s-60 bg-[#FFFFFF08] rounded hover:bg-[#FFFFFF12] disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-xs text-dark-s-80">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs text-dark-s-60 bg-[#FFFFFF08] rounded hover:bg-[#FFFFFF12] disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && entries.length === 0 && (
        <p className="text-center text-dark-s-80 py-8">No entries yet. Be the first!</p>
      )}
    </div>
  );
}
