"use client";

import Image from "next/image";

import type { BonfireInfo } from "@/types";
import { cn } from "@/lib/cn";
import { config } from "@/lib/config";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Pick the app root that matches the current hostname. */
function getAppRoot(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const match = config.subdomain.appRoots.find(
      (root) => hostname === root || hostname.endsWith(`.${root}`),
    );
    if (match) return match;
  }
  return config.subdomain.appRoots[0] ?? "app.bonfires.ai";
}

/**
 * Build a subdomain URL for a bonfire.
 * Uses the backend slug if available, otherwise falls back to the bonfire ID
 * (the resolve-subdomain endpoint accepts both slugs and ObjectIds).
 */
function getBonfireBaseUrl(bonfire: BonfireInfo): string {
  const slug = bonfire.slug ?? bonfire.id;
  return `https://${slug}.${getAppRoot()}`;
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function BonfireCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl w-full flex items-center gap-5 p-4 lg:p-5 bg-[#FFFFFF05] border border-[#333333] animate-pulse",
        className,
      )}
    >
      {/* Logo placeholder */}
      <div className="shrink-0 h-14 w-14 rounded-lg bg-[#FFFFFF15]" />

      {/* Text placeholder */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-5 w-1/3 bg-[#FFFFFF15] rounded" />
        <div className="h-3.5 w-full bg-[#FFFFFF10] rounded" />
        <div className="flex gap-2">
          <span className="h-5 w-20 bg-[#FFFFFF15] rounded-full" />
          <span className="h-5 w-24 bg-[#FFFFFF15] rounded-full" />
        </div>
      </div>

      {/* Button placeholder */}
      <div className="shrink-0 h-10 w-32 bg-[#FFFFFF10] rounded-lg" />
    </div>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────

interface BonfireCardProps {
  data?: BonfireInfo;
  isLoading?: boolean;
  className?: string;
}

export default function BonfireCard({
  data,
  isLoading,
  className,
}: BonfireCardProps) {
  if (isLoading || !data) {
    return <BonfireCardSkeleton className={className} />;
  }

  const baseUrl = getBonfireBaseUrl(data);
  const graphUrl = `${baseUrl}/graph`;

  return (
    <a
      href={baseUrl}
      className={cn(
        "group rounded-2xl w-full flex items-center gap-5 p-4 lg:p-5",
        "bg-[#FFFFFF05] border border-[#333333]",
        "transition-all hover:border-brand-primary/40 hover:bg-[#FFFFFF08] no-underline",
        className,
      )}
    >
      {/* Logo */}
      <div className="shrink-0 px-1">
        <Image
          src="/logo-square.svg"
          alt=""
          width={56}
          height={56}
          className="h-12 w-12 lg:h-14 lg:w-14"
        />
      </div>

      {/* Content: name + description + taxonomy badges */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <h3 className="text-base lg:text-lg font-semibold text-dark-s-0 truncate">
          {data.name}
        </h3>

        {/* Description */}
        {data.description && (
          <p className="mt-0.5 text-xs lg:text-sm text-dark-s-60 line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Taxonomy badges */}
        {data.latest_taxonomies && data.latest_taxonomies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.latest_taxonomies.slice(0, 6).map((tax) => (
              <span
                key={tax.name}
                className="text-xs text-dark-s-60 bg-dark-s-700/50 px-2 py-0.5 rounded-full"
              >
                {tax.name}
              </span>
            ))}
            {data.latest_taxonomies.length > 6 && (
              <span className="text-xs text-dark-s-80">
                +{data.latest_taxonomies.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Explore Graph button */}
      <a
        href={graphUrl}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-brand-primary/50 text-brand-primary text-sm font-medium transition-colors hover:bg-brand-primary/10 no-underline"
      >
        Explore Graph
      </a>
    </a>
  );
}
