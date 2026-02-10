"use client";

import { useBonfiresQuery } from "@/hooks";
import type { BonfireInfo } from "@/types";

import BonfireCard from "@/components/explore/bonfire-card";

const PAGE_SIZE = 8;

export default function ExploreBonfiresPage() {
  const { data, isLoading, isError, error } = useBonfiresQuery();

  const bonfires: BonfireInfo[] = data?.bonfires ?? [];
  const publicBonfires = bonfires.filter((b) => b.is_public !== false);

  return (
    <main className="flex flex-col px-6 lg:px-20 py-7 lg:py-18 min-h-screen max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-montserrat text-2xl lg:text-4xl font-bold text-dark-s-0">
          Explore Bonfires
        </h1>
        <p className="mt-2 text-dark-s-60 text-sm lg:text-base max-w-2xl">
          Discover publicly available bonfires -- each one is a
          community-driven knowledge space with its own AI agent, knowledge
          graph, and data rooms.
        </p>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: PAGE_SIZE }, (_, i) => (
            <BonfireCard key={`skeleton-${i}`} isLoading />
          ))
          : publicBonfires.map((bonfire) => (
            <BonfireCard key={bonfire.id} data={bonfire} />
          ))}
      </div>

      {/* Empty state */}
      {!isLoading && publicBonfires.length === 0 && !isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-dark-s-60 text-lg">No public bonfires found.</p>
          <p className="text-dark-s-80 text-sm mt-2">
            Check back later -- new bonfires are being created all the time.
          </p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="mt-4 text-center text-sm text-red-400">
          {error instanceof Error ? error.message : "Failed to load bonfires"}
        </div>
      )}
    </main>
  );
}
