"use client";

import { use } from "react";
import Link from "next/link";
import { useHackathonTrack } from "@/hooks";
import LeaderboardTable from "@/components/hackathon/leaderboard-table";
import CountdownTimer from "@/components/hackathon/countdown-timer";
import { cn } from "@/lib/cn";

const CADENCE_COLORS = {
  weekly: "text-emerald-400",
  monthly: "text-amber-400",
  yearly: "text-purple-400",
} as const;

export default function TrackDetailPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = use(params);
  const { data: track, isLoading, isError } = useHackathonTrack(trackId);

  if (isLoading) {
    return (
      <main className="flex flex-col px-6 lg:px-20 py-7 lg:py-18 min-h-screen max-w-screen-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-[#FFFFFF15] rounded" />
          <div className="h-5 w-1/2 bg-[#FFFFFF10] rounded" />
          <div className="h-40 bg-[#FFFFFF05] rounded-2xl" />
        </div>
      </main>
    );
  }

  if (isError || !track) {
    return (
      <main className="flex flex-col items-center justify-center px-6 py-20 min-h-screen">
        <p className="text-dark-s-60">Track not found.</p>
        <Link href="/hackathon" className="mt-3 text-brand-primary text-sm hover:underline">
          Back to Hackathon
        </Link>
      </main>
    );
  }

  const cadenceColor = CADENCE_COLORS[track.cadence] ?? "text-dark-s-0";

  return (
    <main className="flex flex-col px-6 lg:px-20 py-7 lg:py-18 min-h-screen max-w-screen-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm">
        <Link href="/hackathon" className="text-dark-s-80 hover:text-dark-s-60 no-underline">
          Hackathon
        </Link>
        <span className="text-dark-s-80 mx-2">/</span>
        <span className="text-dark-s-60">{track.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={cn("text-xs font-semibold uppercase tracking-wider", cadenceColor)}>
              {track.cadence}
            </span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              track.status === "active"
                ? "bg-emerald-500/15 text-emerald-400"
                : track.status === "judging"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-[#FFFFFF08] text-dark-s-80",
            )}>
              {track.status}
            </span>
          </div>
          <h1 className="font-montserrat text-2xl lg:text-4xl font-bold text-dark-s-0">
            {track.name}
          </h1>
          {track.description && (
            <p className="mt-2 text-dark-s-60 text-sm max-w-xl">{track.description}</p>
          )}
        </div>

        {track.status === "active" && (
          <div className="shrink-0">
            <CountdownTimer endDate={track.ends_at} />
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Escrow", value: `${track.escrow_address.slice(0, 6)}...${track.escrow_address.slice(-4)}`, accent: true },
          { label: "Submissions", value: String(track.submission_count) },
          { label: "Next Review", value: track.current_entry_price_usd != null ? `$${track.current_entry_price_usd.toFixed(2)}` : "--" },
          { label: "Fee", value: `${(track.platform_fee_bps / 100).toFixed(1)}%` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4 bg-[#FFFFFF05] border border-[#333333]"
          >
            <span className="text-xs text-dark-s-80 uppercase tracking-wider">{stat.label}</span>
            <span className={cn(
              "block text-xl lg:text-2xl font-bold mt-1 font-mono",
              stat.accent ? "text-brand-primary" : "text-dark-s-0",
            )}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Submit CTA */}
      {track.status === "active" && (
        <div className="mb-8 flex items-center gap-4 p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/20">
          <div className="flex-1">
            <span className="text-dark-s-0 font-semibold">Ready to compete?</span>
            <span className="block text-dark-s-60 text-sm mt-0.5">
              Submit your project for an AI review. Cost: ${track.current_entry_price_usd?.toFixed(2) ?? "..."} (increases with each review).
            </span>
          </div>
          <Link
            href={`/hackathon/${trackId}/submit`}
            className="shrink-0 inline-flex items-center px-5 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-semibold no-underline hover:bg-brand-primary/90 transition-colors"
          >
            Submit Entry
          </Link>
        </div>
      )}

      {/* Leaderboard */}
      <h2 className="font-montserrat text-lg font-bold text-dark-s-0 mb-4">
        Leaderboard
      </h2>
      <LeaderboardTable trackId={trackId} />
    </main>
  );
}
