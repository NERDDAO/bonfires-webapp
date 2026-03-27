"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { AggregatedSubmission } from "@/types";
import { useLeaderboard } from "@/hooks";
import { apiClient } from "@/lib/api/client";
import { useWalletAccount } from "@/lib/wallet/e2e";

type SortKey = "weighted_score" | "community_votes" | "recent";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "weighted_score", label: "AI Score" },
  { key: "community_votes", label: "Votes" },
  { key: "recent", label: "Newest" },
];

function truncateWallet(wallet: string): string {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function recommendationBadge(rec: string): { label: string; color: string } {
  switch (rec.toLowerCase()) {
    case "accept":
    case "top25_candidate":
      return { label: rec === "top25_candidate" ? "Top 25" : "Accept", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
    case "maybe":
      return { label: "Maybe", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    case "reject":
      return { label: "Reject", color: "bg-red-500/15 text-red-400 border-red-500/30" };
    default:
      return { label: rec, color: "bg-[#FFFFFF08] text-dark-s-60 border-[#333333]" };
  }
}

// ─── Vote button ─────────────────────────────────────────────────────────────

function VoteButton({
  hyperblogId,
  trackId,
  currentVotes,
  onVoted,
}: {
  hyperblogId: string;
  trackId: string;
  currentVotes: number;
  onVoted?: () => void;
}) {
  const { address } = useWalletAccount();
  const [voting, setVoting] = useState(false);
  const [localVotes, setLocalVotes] = useState(currentVotes);

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!address || voting) return;
    setVoting(true);
    try {
      await apiClient.post(`/api/hackathon/tracks/${trackId}/vote`, {
        hyperblog_id: hyperblogId,
        wallet: address,
        vote_type: "upvote",
      });
      setLocalVotes((v) => v + 1);
      onVoted?.();
    } catch {
      // Already voted or error — ignore
    } finally {
      setVoting(false);
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={!address || voting}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
        address
          ? "hover:bg-brand-primary/10 hover:text-brand-primary text-dark-s-60"
          : "text-dark-s-80 cursor-not-allowed",
      )}
      title={address ? "Upvote this submission" : "Connect wallet to vote"}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
        <path d="M6 2L10 7H2L6 2Z" fill="currentColor" />
      </svg>
      {localVotes}
    </button>
  );
}

// ─── Expandable row detail ───────────────────────────────────────────────────

function EntryDetail({ entry }: { entry: AggregatedSubmission }) {
  return (
    <div className="px-4 py-3 bg-[#FFFFFF03] space-y-2">
      {entry.summary && (
        <p className="text-xs text-dark-s-60">{entry.summary}</p>
      )}
      <div className="flex flex-wrap gap-3">
        {entry.strengths && entry.strengths.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Strengths</span>
            <ul className="mt-1 space-y-0.5">
              {entry.strengths.slice(0, 3).map((s, i) => (
                <li key={i} className="text-xs text-dark-s-60">+ {s}</li>
              ))}
            </ul>
          </div>
        )}
        {entry.concerns && entry.concerns.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">Concerns</span>
            <ul className="mt-1 space-y-0.5">
              {entry.concerns.slice(0, 3).map((c, i) => (
                <li key={i} className="text-xs text-dark-s-60">- {c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main table ──────────────────────────────────────────────────────────────

interface LeaderboardTableProps {
  trackId: string;
  className?: string;
}

export default function LeaderboardTable({ trackId, className }: LeaderboardTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>("weighted_score");
  const [page, setPage] = useState(1);
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);
  const { data, isLoading, refetch } = useLeaderboard(trackId, sortBy, page);

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

      {/* Entries */}
      <div className="space-y-1">
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => (
              <div key={`skel-${i}`} className="h-16 bg-[#FFFFFF05] rounded-xl animate-pulse" />
            ))
          : entries.map((entry, idx) => {
              const rank = (page - 1) * 20 + idx + 1;
              const isExpanded = expandedWallet === entry.wallet;
              const rec = entry.recommendation ? recommendationBadge(entry.recommendation) : null;

              return (
                <div key={entry.wallet} className="rounded-xl border border-[#222222] overflow-hidden">
                  {/* Main row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF05] transition-colors cursor-pointer"
                    onClick={() => setExpandedWallet(isExpanded ? null : entry.wallet)}
                  >
                    {/* Rank */}
                    <span className="text-dark-s-80 font-mono text-sm w-6 shrink-0 text-right">
                      {rank}
                    </span>

                    {/* Score circle */}
                    <div className="shrink-0 w-10 h-10 rounded-full bg-[#FFFFFF08] flex items-center justify-center">
                      {entry.weighted_score != null ? (
                        <span className={cn("text-sm font-bold", scoreColor(entry.weighted_score))}>
                          {Math.round(entry.weighted_score)}
                        </span>
                      ) : (
                        <span className="text-dark-s-80 text-xs">--</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/hyperblogs/${entry.latest_hyperblog_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-medium text-brand-primary hover:underline truncate no-underline"
                        >
                          {entry.latest_hyperblog_title ?? "Untitled"}
                        </a>
                        {rec && (
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border shrink-0", rec.color)}>
                            {rec.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-dark-s-80">
                        <span className="font-mono">{truncateWallet(entry.wallet)}</span>
                        <span>{entry.review_count} review{entry.review_count !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Vote */}
                    <VoteButton
                      hyperblogId={entry.latest_hyperblog_id}
                      trackId={trackId}
                      currentVotes={entry.total_votes}
                      onVoted={() => refetch()}
                    />

                    {/* Expand indicator */}
                    <svg
                      width="12" height="12" viewBox="0 0 12 12"
                      className={cn("shrink-0 text-dark-s-80 transition-transform", isExpanded && "rotate-180")}
                    >
                      <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (entry.summary || entry.strengths || entry.concerns) && (
                    <EntryDetail entry={entry} />
                  )}
                </div>
              );
            })}
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
          <span className="text-xs text-dark-s-80">{page} / {totalPages}</span>
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
