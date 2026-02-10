/**
 * Subdomain parsing utilities for bonfire-specific subdomains.
 *
 * App roots come from NEXT_PUBLIC_APP_ROOTS (comma-separated) plus VERCEL_URL
 * when on Vercel (for preview URLs like boulder.project-git-branch.vercel.app).
 *
 * Supports:
 * - app roots (no subdomain)
 * - boulder.app.bonfires.ai (bonfire subdomain)
 * - boulder.{VERCEL_URL} on Vercel preview deployments
 * - localhost / 127.0.0.1 always return null (no subdomain)
 */
import { config } from "@/lib/config";

/** Subdomains that are never bonfire slugs (infra, Clerk, etc.) */
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "clerk",
  "accounts",
]);

/**
 * Normalize hostname: take first host before comma (x-forwarded-host list),
 * strip port (handles IPv6 [::1]:3000 and IPv4 localhost:3000).
 */
function normalizeHostname(raw: string): string {
  const first = raw.trim().toLowerCase().split(",")[0]?.trim() ?? "";
  if (!first) return "";
  // IPv6: [::1]:3000 -> [::1]
  if (first.startsWith("[")) {
    const close = first.indexOf("]");
    if (close >= 0) return first.slice(0, close + 1);
  }
  // IPv4/hostname: host:port -> host
  const colon = first.indexOf(":");
  return colon >= 0 ? first.slice(0, colon) : first;
}

/**
 * Get the subdomain label when on a bonfire-specific subdomain.
 *
 * Uses config.subdomain.appRoots (from NEXT_PUBLIC_APP_ROOTS). Returns the label
 * immediately before the app root (e.g. boulder.app.bonfires.ai -> "boulder").
 * Returns null for app roots, localhost, 127.0.0.1, or other hosts.
 *
 * @param hostname - The hostname from the request (e.g., from headers or window.location)
 * @returns The subdomain label (e.g., "boulder") or null if not on a bonfire subdomain
 */
export function getSubdomainLabel(hostname: string): string | null {
  if (!hostname || typeof hostname !== "string") return null;
  const hostWithoutPort = normalizeHostname(hostname);

  // localhost, 127.0.0.1, [::1], or bare hostname - no subdomain
  if (
    hostWithoutPort === "localhost" ||
    hostWithoutPort === "127.0.0.1" ||
    hostWithoutPort === "[::1]" ||
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
    if (
      hostWithoutPort.endsWith(suffix) &&
      hostWithoutPort.length > suffix.length
    ) {
      const prefix = hostWithoutPort.slice(0, -suffix.length);
      const label = prefix.split(".").pop() ?? prefix;
      if (!label || RESERVED_SUBDOMAINS.has(label)) return null;
      return label;
    }
  }

  return null;
}
