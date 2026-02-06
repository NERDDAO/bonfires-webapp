/**
 * Subdomain parsing utilities for bonfire-specific subdomains.
 *
 * App roots are configured via NEXT_PUBLIC_APP_ROOTS (comma-separated).
 * Defaults: app.bonfires.ai, staging-app.bonfires.ai
 *
 * Supports:
 * - app roots (no subdomain)
 * - boulder.app.bonfires.ai (bonfire subdomain)
 * - localhost / 127.0.0.1 always return null (no subdomain)
 */

import { config } from "@/lib/config";

/**
 * Check if a string is a valid MongoDB ObjectId format (24 hex chars).
 */
export function isObjectIdFormat(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  return /^[a-fA-F0-9]{24}$/.test(str.trim());
}

/**
 * Get the subdomain label when on a bonfire-specific subdomain.
 *
 * Uses config.subdomain.appRoots (from NEXT_PUBLIC_APP_ROOTS). Returns the first label
 * when hostname is {label}.{appRoot} and is not exactly the app root.
 * Returns null for app roots, localhost, 127.0.0.1, or other hosts.
 *
 * @param hostname - The hostname from the request (e.g., from headers or window.location)
 * @returns The subdomain label (e.g., "boulder") or null if not on a bonfire subdomain
 */
export function getSubdomainLabel(hostname: string): string | null {
  if (!hostname || typeof hostname !== "string") return null;
  const h = hostname.trim().toLowerCase();

  // Strip port if present (e.g. localhost:3000)
  const hostWithoutPort = h.split(":")[0] ?? h;

  // localhost, 127.0.0.1, or bare hostname - no subdomain
  if (
    hostWithoutPort === "localhost" ||
    hostWithoutPort === "127.0.0.1" ||
    !hostWithoutPort.includes(".")
  ) {
    return null;
  }

  const appRoots = config.subdomain.appRoots;
  if (appRoots.length === 0) return null;

  // Exact match for app roots - no subdomain
  if (appRoots.includes(hostWithoutPort)) return null;

  // Check if hostname ends with .{appRoot}
  for (const root of appRoots) {
    const suffix = `.${root}`;
    if (hostWithoutPort.endsWith(suffix) && hostWithoutPort.length > suffix.length) {
      const prefix = hostWithoutPort.slice(0, -suffix.length);
      const label = prefix.split(".").pop() ?? prefix;
      return label || null;
    }
  }

  return null;
}
