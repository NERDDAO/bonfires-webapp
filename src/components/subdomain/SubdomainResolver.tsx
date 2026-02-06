import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSubdomainLabel } from "@/lib/utils/subdomain";
import { SubdomainBonfireProvider } from "@/contexts/SubdomainBonfireContext";

const BACKEND_URL =
  process.env["DELVE_API_URL"] ??
  process.env["NEXT_PUBLIC_DELVE_API_URL"] ??
  "http://localhost:8000";

const CACHE_TTL_SUCCESS_SEC = 3600; // 1 hour when subdomain exists
const CACHE_TTL_NOT_FOUND_SEC = 60; // 1 min when subdomain doesn't exist

export interface SubdomainConfig {
  bonfireId: string;
  agentId: string | null;
}

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
  if (headersList.get("x-skip-subdomain-resolution") === "true") {
    return (
      <SubdomainBonfireProvider initialConfig={null} hostname={null}>
        {children}
      </SubdomainBonfireProvider>
    );
  }
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  const subdomainLabel = getSubdomainLabel(host);

  let initialConfig: SubdomainConfig | null = null;

  if (subdomainLabel) {
    const cached = getCached(subdomainLabel);
    if (cached) {
      if (!cached.found) redirect("/subdomain-not-found");
      initialConfig = cached.config;
    } else {
      try {
        const res = await fetch(
          `${BACKEND_URL}/bonfires/resolve-subdomain/${encodeURIComponent(subdomainLabel)}`,
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
        const data = (await res.json()) as { bonfire_id: string; agent_id: string | null };
        const config: SubdomainConfig = {
          bonfireId: data.bonfire_id,
          agentId: data.agent_id ?? null,
        };
        setCached(subdomainLabel, {
          found: true,
          config,
          expiresAt: Date.now() + CACHE_TTL_SUCCESS_SEC * 1000,
        });
        initialConfig = config;
      } catch {
        redirect("/subdomain-not-found");
      }
    }
  }

  return (
    <SubdomainBonfireProvider initialConfig={initialConfig} hostname={host}>
      {children}
    </SubdomainBonfireProvider>
  );
}
