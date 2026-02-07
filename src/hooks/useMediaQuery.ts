"use client";

import { useEffect, useState } from "react";

/**
 * Subscribes to a media query and returns whether it matches.
 * SSR-safe: returns false until after mount, then reflects matchMedia(query).matches.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** Breakpoint used for mobile vs desktop (matches Tailwind md: 768px). */
export const MOBILE_BREAKPOINT_PX = 768;

/** Media query string for viewports narrower than the mobile breakpoint. */
export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`;

/** True when viewport is below the mobile breakpoint (max-width: 767px). */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_MEDIA_QUERY);
}
