"use client";

import { useState } from "react";
import { useHackathonTracks, useAuth } from "@/hooks";
import TrackCard, { TrackCardSkeleton } from "@/components/hackathon/track-card";
import CreateTrackModal from "@/components/hackathon/create-track-modal";
import type { HackathonTrackInfo } from "@/types";

const CADENCES = ["weekly", "monthly", "yearly"] as const;

const CADENCE_META: Record<(typeof CADENCES)[number], { title: string; description: string }> = {
  weekly: { title: "Weekly Sprints", description: "Fast-paced challenges. Ship quick, iterate fast." },
  monthly: { title: "Monthly Builds", description: "Deeper projects with room to breathe." },
  yearly: { title: "Grand Challenge", description: "The big one. Ambitious scope, major prizes." },
};

export default function HackathonPage() {
  const { data: tracks, isLoading, refetch } = useHackathonTracks();
  const { isSignedIn } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const grouped = CADENCES.reduce(
    (acc, c) => {
      acc[c] = (tracks ?? []).filter((t: HackathonTrackInfo) => t.cadence === c);
      return acc;
    },
    {} as Record<(typeof CADENCES)[number], HackathonTrackInfo[]>,
  );

  const totalSubmissions = (tracks ?? []).reduce(
    (sum: number, t: HackathonTrackInfo) => sum + t.submission_count,
    0,
  );

  return (
    <main className="flex flex-col px-6 lg:px-20 py-7 lg:py-18 min-h-screen max-w-screen-2xl mx-auto">
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="font-montserrat text-3xl lg:text-5xl font-bold text-dark-s-0">
          Always-On Hackathon
        </h1>
        <p className="mt-3 text-dark-s-60 text-sm lg:text-base max-w-xl mx-auto">
          Submit your project, get an AI-powered review, and compete across parallel tracks.
          Every review is an entry. Every entry funds the prize pool.
        </p>
        {totalSubmissions > 0 && (
          <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFFFFF05] border border-[#333333]">
            <span className="text-dark-s-80 text-sm">Total Submissions</span>
            <span className="text-2xl font-bold text-brand-primary font-mono">
              {totalSubmissions.toLocaleString()}
            </span>
          </div>
        )}
        {isSignedIn && (
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 transition-colors"
            >
              Create Track
            </button>
          </div>
        )}
      </div>

      <CreateTrackModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => { setShowCreateModal(false); refetch(); }}
      />

      {/* Tracks by cadence */}
      {CADENCES.map((cadence) => (
        <section key={cadence} className="mb-10">
          <div className="mb-4">
            <h2 className="font-montserrat text-xl lg:text-2xl font-bold text-dark-s-0">
              {CADENCE_META[cadence].title}
            </h2>
            <p className="text-dark-s-60 text-sm mt-1">
              {CADENCE_META[cadence].description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading
              ? Array.from({ length: 2 }, (_, i) => (
                  <TrackCardSkeleton key={`skel-${cadence}-${i}`} />
                ))
              : grouped[cadence].length > 0
                ? grouped[cadence].map((track) => (
                    <TrackCard key={track.id} track={track} />
                  ))
                : (
                    <div className="col-span-full py-8 text-center text-dark-s-80 text-sm">
                      No {cadence} tracks yet.
                    </div>
                  )}
          </div>
        </section>
      ))}

      {/* How it works */}
      <section className="mt-4 mb-10 p-6 rounded-2xl bg-[#FFFFFF05] border border-[#333333]">
        <h2 className="font-montserrat text-lg font-bold text-dark-s-0 mb-4">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {[
            { step: "1", title: "Submit", desc: "Share your project URL and pick a track" },
            { step: "2", title: "Pay for Review", desc: "x402 micropayment funds the prize pool" },
            { step: "3", title: "Get Reviewed", desc: "AI agents analyze and score your project" },
            { step: "4", title: "Compete", desc: "Top scores get shortlisted, community votes pick winners" },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <span className="shrink-0 w-8 h-8 rounded-full bg-brand-primary/15 text-brand-primary font-bold text-sm flex items-center justify-center">
                {s.step}
              </span>
              <div>
                <span className="font-semibold text-dark-s-0">{s.title}</span>
                <p className="text-dark-s-60 text-xs mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
