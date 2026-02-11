"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { getSubdomainLabel } from "@/lib/utils/subdomain";

export interface SubdomainConfig {
  bonfireId: string;
  agentId: string | null;
  isPublic: boolean;
  /** The subdomain slug (e.g. "boulder"). Available after resolution. */
  slug: string | null;
}

interface SubdomainBonfireContextValue {
  /** Resolved bonfire config when on a bonfire subdomain */
  subdomainConfig: SubdomainConfig | null;
  /** True when the app is scoped to a bonfire subdomain */
  isSubdomainScoped: boolean;
  /** Loading state during resolution */
  isLoading: boolean;
  /** Error if resolution failed (will redirect to error page) */
  error: string | null;
}

const SubdomainBonfireContext =
  createContext<SubdomainBonfireContextValue | null>(null);

interface SubdomainBonfireProviderProps {
  children: ReactNode;
  /** Pre-resolved config from server (avoids client fetch) */
  initialConfig?: SubdomainConfig | null;
  /** Hostname from server headers (for SSR/initial pass) */
  hostname?: string | null;
}

export function SubdomainBonfireProvider({
  children,
  initialConfig,
  hostname,
}: SubdomainBonfireProviderProps) {
  const router = useRouter();
  const [config, setConfig] = useState<SubdomainConfig | null>(
    initialConfig ?? null
  );
  const [isLoading, setIsLoading] = useState(!initialConfig && !!hostname);
  const [error, setError] = useState<string | null>(null);

  const resolvedHostname =
    hostname ??
    (typeof window !== "undefined" ? window.location.hostname : null);
  const subdomainLabel = useMemo(
    () => (resolvedHostname ? getSubdomainLabel(resolvedHostname) : null),
    [resolvedHostname]
  );

  const resolveSubdomain = useCallback(
    async (label: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/bonfires/resolve-subdomain/${encodeURIComponent(label)}`,
          {
            method: "GET",
          }
        );
        if (!res.ok) {
          if (res.status === 404) {
            router.replace("/subdomain-not-found");
            return;
          }
          throw new Error(res.statusText || "Failed to resolve subdomain");
        }
        const data = (await res.json()) as {
          bonfire_id: string;
          agent_id: string | null;
          is_public: boolean;
        };
        setConfig({
          bonfireId: data.bonfire_id,
          agentId: data.agent_id ?? null,
          isPublic: data.is_public,
          slug: label,
        });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Failed to resolve subdomain";
        setError(msg);
        router.replace("/subdomain-not-found");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      setIsLoading(false);
      return;
    }
    if (subdomainLabel) {
      resolveSubdomain(subdomainLabel);
    } else {
      setIsLoading(false);
      setConfig(null);
    }
  }, [subdomainLabel, initialConfig, resolveSubdomain]);

  const value: SubdomainBonfireContextValue = useMemo(
    () => ({
      subdomainConfig: config,
      isSubdomainScoped: !!config,
      isLoading,
      error,
    }),
    [config, isLoading, error]
  );

  return (
    <SubdomainBonfireContext.Provider value={value}>
      {children}
    </SubdomainBonfireContext.Provider>
  );
}

export function useSubdomainBonfire(): SubdomainBonfireContextValue {
  const ctx = useContext(SubdomainBonfireContext);
  if (!ctx) {
    return {
      subdomainConfig: null,
      isSubdomainScoped: false,
      isLoading: false,
      error: null,
    };
  }
  return ctx;
}
