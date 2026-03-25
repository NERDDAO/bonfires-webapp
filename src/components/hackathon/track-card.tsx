"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import type { HackathonTrackInfo } from "@/types";

const CADENCE_STYLES = {
  weekly: { color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10", icon: "\u26A1" },
  monthly: { color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10", icon: "\uD83D\uDD25" },
  yearly: { color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10", icon: "\uD83C\uDFC6" },
} as const;

function useCountdown(endDate: string) {
  // Simple static countdown for SSR — will hydrate
  const now = Date.now();
  const end = new Date(endDate).getTime();
  const diff = Math.max(0, end - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatUSD(amount: number): string {
  return amount >= 1000
    ? `$${(amount / 1000).toFixed(1)}k`
    : `$${amount.toFixed(0)}`;
}

interface TrackCardProps {
  track: HackathonTrackInfo;
  compact?: boolean;
  className?: string;
}

export default function TrackCard({ track, compact, className }: TrackCardProps) {
  const style = CADENCE_STYLES[track.cadence];
  const countdown = useCountdown(track.ends_at);
  const isActive = track.status === "active";

  return (
    <Link
      href={`/hackathon/${track.id}`}
      className={cn(
        "group block rounded-2xl p-4 lg:p-5 no-underline transition-all",
        "bg-[#FFFFFF05] border",
        isActive ? style.border : "border-[#333333]",
        "hover:bg-[#FFFFFF08]",
        compact ? "min-w-[260px]" : "",
        className,
      )}
    >
      {/* Cadence badge + status */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn("text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full", style.bg, style.color)}>
          {style.icon} {track.cadence}
        </span>
        {isActive && (
          <span className="text-xs text-dark-s-80">
            {countdown} left
          </span>
        )}
        {track.status === "judging" && (
          <span className="text-xs text-amber-400">Judging</span>
        )}
      </div>

      {/* Name */}
      <h3 className="font-montserrat text-base lg:text-lg font-semibold text-dark-s-0 truncate">
        {track.name}
      </h3>

      {track.description && !compact && (
        <p className="mt-1 text-xs text-dark-s-60 line-clamp-2">{track.description}</p>
      )}

      {/* Stats */}
      <div className="mt-3 flex items-center gap-4 text-xs">
        <div>
          <span className={cn("text-lg font-bold", style.color)}>
            {formatUSD(track.prize_pool_usd)}
          </span>
          <span className="block text-dark-s-80 mt-0.5">Prize Pool</span>
        </div>
        <div className="h-8 w-px bg-[#333333]" />
        <div>
          <span className="text-lg font-bold text-dark-s-0">
            {track.entry_count}
          </span>
          <span className="block text-dark-s-80 mt-0.5">Entries</span>
        </div>
        {track.current_entry_price_usd != null && (
          <>
            <div className="h-8 w-px bg-[#333333]" />
            <div>
              <span className="text-lg font-bold text-dark-s-0">
                ${track.current_entry_price_usd.toFixed(2)}
              </span>
              <span className="block text-dark-s-80 mt-0.5">Next Review</span>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

export function TrackCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-2xl p-4 lg:p-5 bg-[#FFFFFF05] border border-[#333333] animate-pulse min-w-[260px]",
      className,
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-20 bg-[#FFFFFF15] rounded-full" />
        <div className="h-4 w-16 bg-[#FFFFFF10] rounded" />
      </div>
      <div className="h-5 w-3/4 bg-[#FFFFFF15] rounded mb-3" />
      <div className="flex gap-4">
        <div className="h-10 w-16 bg-[#FFFFFF10] rounded" />
        <div className="h-10 w-16 bg-[#FFFFFF10] rounded" />
      </div>
    </div>
  );
}
