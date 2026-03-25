"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useHackathonTrack } from "@/hooks";

export default function SubmitEntryPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = use(params);
  const { data: track, isLoading } = useHackathonTrack(trackId);
  const [projectUrl, setProjectUrl] = useState("");

  if (isLoading || !track) {
    return (
      <main className="flex flex-col px-6 lg:px-20 py-7 lg:py-18 min-h-screen max-w-screen-2xl mx-auto">
        <div className="animate-pulse space-y-4 max-w-lg">
          <div className="h-8 w-1/3 bg-[#FFFFFF15] rounded" />
          <div className="h-12 bg-[#FFFFFF08] rounded-lg" />
        </div>
      </main>
    );
  }

  const price = track.current_entry_price_usd;

  return (
    <main className="flex flex-col px-6 lg:px-20 py-7 lg:py-18 min-h-screen max-w-screen-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm">
        <Link href="/hackathon" className="text-dark-s-80 hover:text-dark-s-60 no-underline">
          Hackathon
        </Link>
        <span className="text-dark-s-80 mx-2">/</span>
        <Link href={`/hackathon/${trackId}`} className="text-dark-s-80 hover:text-dark-s-60 no-underline">
          {track.name}
        </Link>
        <span className="text-dark-s-80 mx-2">/</span>
        <span className="text-dark-s-60">Submit</span>
      </div>

      <div className="max-w-lg">
        <h1 className="font-montserrat text-2xl lg:text-3xl font-bold text-dark-s-0 mb-2">
          Submit Entry
        </h1>
        <p className="text-dark-s-60 text-sm mb-8">
          Your project will receive an AI-powered review. The review fee funds the prize pool.
        </p>

        {/* Project URL */}
        <label className="block mb-6">
          <span className="text-sm font-medium text-dark-s-0">Project URL</span>
          <input
            type="url"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            placeholder="https://github.com/your/project"
            className="mt-2 w-full px-4 py-3 rounded-lg bg-[#FFFFFF08] border border-[#333333] text-sm text-dark-s-0 placeholder:text-dark-s-80 focus:outline-none focus:border-brand-primary/50 transition-colors"
          />
        </label>

        {/* Price display */}
        <div className="rounded-xl p-4 bg-[#FFFFFF05] border border-[#333333] mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-dark-s-60">Review cost</span>
            <span className="text-xl font-bold text-dark-s-0 font-mono">
              {price != null ? `$${price.toFixed(2)}` : "--"}
            </span>
          </div>
          <p className="text-xs text-dark-s-80 mt-2">
            Submission #{track.submission_count + 1} for this track. Price increases with each review.
          </p>
        </div>

        {/* Submit button (payment flow placeholder) */}
        <button
          disabled={!projectUrl.trim()}
          className="w-full py-3 rounded-lg bg-brand-primary text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-primary/90 transition-colors"
        >
          Pay & Submit Entry
        </button>
        <p className="text-xs text-dark-s-80 text-center mt-3">
          Payment via x402 (USDC) to escrow contract. Funds the prize pool directly.
        </p>
      </div>
    </main>
  );
}
