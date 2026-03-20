"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useDataRoomById } from "@/hooks";

import { cn } from "@/lib/cn";

import DataroomCard from "@/components/hyperblogs/dataroom-card";

export default function DataroomDetailPage() {
  const params = useParams();
  const dataroomId = params["dataroomId"] as string;

  const { data: dataroom, isLoading, isError, error } = useDataRoomById(dataroomId);

  const layoutClass =
    "flex flex-col items-center px-4 sm:px-6 lg:px-8 py-7 lg:py-18 min-h-screen w-full";
  const contentMaxWidth = "w-full max-w-2xl";

  return (
    <main className={cn(layoutClass)}>
      <div className={cn(contentMaxWidth, "flex flex-col")}>
        <Link
          href="/hyperblogs"
          className="text-sm text-[#A9A9A9] hover:text-white mb-6 inline-flex items-center gap-1 transition-colors w-fit"
        >
          ← Back to Hyperblogs
        </Link>

        {isError && (
          <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <h3 className="font-bold text-white">Error loading dataroom</h3>
            <p className="text-sm text-[#A9A9A9] mt-1">
              {error instanceof Error ? error.message : "Failed to load dataroom"}
            </p>
          </div>
        )}

        <DataroomCard
          data={dataroom ?? undefined}
          isLoading={isLoading}
          autoOpenCreate
        />
      </div>
    </main>
  );
}
