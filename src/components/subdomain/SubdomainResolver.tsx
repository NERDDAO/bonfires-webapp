import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  SubdomainBonfireProvider,
  type SubdomainConfig,
} from "@/contexts/SubdomainBonfireContext";

import { config as appConfig } from "@/lib/config";
import { getSubdomainLabel } from "@/lib/utils/subdomain";

const CACHE_TTL_SUCCESS_SEC = 3600; // 1 hour when subdomain exists
const CACHE_TTL_NOT_FOUND_SEC = 60; // 1 min when subdomain doesn't exist
const MAX_CACHE_SIZE = 500;

interface SubdomainResolverProps {
  children: React.ReactNode;
}

type CacheEntry =
  | { found: true; config: SubdomainConfig; expiresAt: number }
  | { found: false; expiresAt: number };

const resolutionCache = new Map<string, CacheEntry>();

function getCached(key: string): CacheEntry | null {
  const entry = resolutionCache.get(key);
  if (!entry || Date.now() >= entry.expiresAt) {
    if (entry) resolutionCache.delete(key);
    return null;
  }
  return entry;
}

function setCached(key: string, entry: CacheEntry): void {
  if (resolutionCache.size >= MAX_CACHE_SIZE) {
    const now = Date.now();
    for (const [k, v] of resolutionCache.entries()) {
      if (now >= v.expiresAt) resolutionCache.delete(k);
    }
    if (resolutionCache.size >= MAX_CACHE_SIZE) {
      const oldest = [...resolutionCache.entries()].sort(
        (a, b) => a[1].expiresAt - b[1].expiresAt
      )[0];
      if (oldest) resolutionCache.delete(oldest[0]);
    }
  }
  resolutionCache.set(key, entry);
}

/**
 * Server component that resolves subdomain on the server and passes
 * config to SubdomainBonfireProvider. Redirects to /subdomain-not-found on failure.
 *
 * Caches successful resolutions for 1h, 404s for 1min.
 */
export async function SubdomainResolver({ children }: SubdomainResolverProps) {
  const headersList = await headers();
  const isProd = appConfig.app.environment === "production";
  if (!isProd && headersList.get("x-skip-subdomain-resolution") === "true") {
    return (
      <SubdomainBonfireProvider initialConfig={null} hostname={null}>
        {children}
      </SubdomainBonfireProvider>
    );
  }
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  const subdomainLabel =
    getSubdomainLabel(host) ?? headersList.get("x-subdomain-override");

  let initialConfig: SubdomainConfig | null = null;

  if (subdomainLabel) {
    const cached = getCached(subdomainLabel);
    if (cached) {
      if (!cached.found) redirect("/subdomain-not-found");
      initialConfig = cached.config;
    } else {
      try {
        const backendUrl = appConfig.server.backendUrl;
        const res = await fetch(
          `${backendUrl}/bonfires/resolve-subdomain/${encodeURIComponent(subdomainLabel)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }
        );
        if (!res.ok) {
          setCached(subdomainLabel, {
            found: false,
            expiresAt: Date.now() + CACHE_TTL_NOT_FOUND_SEC * 1000,
          });
          redirect("/subdomain-not-found");
        }
        const data = (await res.json()) as {
          bonfire_id: string;
          agent_id: string | null;
          is_public: boolean;
        };
        const subdomainConfig: SubdomainConfig = {
          bonfireId: data.bonfire_id,
          agentId: data.agent_id ?? null,
          isPublic: data.is_public,
          slug: subdomainLabel,
        };
        setCached(subdomainLabel, {
          found: true,
          config: subdomainConfig,
          expiresAt: Date.now() + CACHE_TTL_SUCCESS_SEC * 1000,
        });
        initialConfig = subdomainConfig;
      } catch {
        redirect("/subdomain-not-found");
      }
    }
  }

  const hostnameForContext = subdomainLabel ? host : null;

  return (
    <SubdomainBonfireProvider
      initialConfig={initialConfig}
      hostname={hostnameForContext}
    >
      {children}
    </SubdomainBonfireProvider>
  );
}
