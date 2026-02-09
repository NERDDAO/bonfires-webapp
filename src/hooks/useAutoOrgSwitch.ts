/**
 * useAutoOrgSwitch Hook
 *
 * Automatically switches the user's active Clerk organization to match the
 * bonfire resolved from the current subdomain.
 *
 * All org ↔ bonfire resolution goes through the backend (ClerkOrgMapping),
 * which is the single source of truth.
 *
 * - Auto-switch: calls GET /resolve-org to find the right org for this bonfire.
 * - Manual switch: calls GET /orgs/{orgId}/bonfire-mapping to find the bonfire
 *   for the new org, then redirects to its subdomain.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth, useClerk, useOrganization } from "@clerk/nextjs";

import { useSubdomainBonfire } from "@/contexts/SubdomainBonfireContext";

import { config as appConfig } from "@/lib/config";

export type AccessStatus = "ok" | "sign_in_required" | "no_access" | "loading";

interface AutoOrgSwitchState {
  /** Whether an org switch is currently in progress */
  isOrgSwitching: boolean;
  /** Current access status for the OrgSwitchGuard to render on */
  accessStatus: AccessStatus;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a URL for a bonfire subdomain.
 *
 * - Production / real subdomains: replaces the subdomain label in the hostname.
 * - Vercel preview URLs: appends ?subdomain= query parameter.
 * - Falls back to ?subdomain= if no app root matches.
 */
function buildSubdomainUrl(slug: string): string {
  const { protocol, host } = window.location;
  const hostname = host.split(":")[0] ?? host;
  const port = host.includes(":") ? `:${host.split(":")[1]}` : "";

  if (hostname.endsWith(".vercel.app")) {
    return `${protocol}//${host}/?subdomain=${encodeURIComponent(slug)}`;
  }

  const appRoots = appConfig.subdomain.appRoots;
  for (const root of appRoots) {
    const suffix = `.${root}`;
    if (hostname.endsWith(suffix) || hostname === root) {
      return `${protocol}//${slug}${suffix}${port}/`;
    }
  }

  return `${protocol}//${host}/?subdomain=${encodeURIComponent(slug)}`;
}

/**
 * Ask the backend which bonfire a Clerk org maps to (ClerkOrgMapping).
 * Returns bonfire_id, is_admin, and subdomain slug in a single call.
 * Caching is handled server-side by the Next.js API route (Cache-Control).
 */
async function resolveOrgBonfireMapping(
  orgId: string
): Promise<{
  bonfire_id: string | null;
  is_admin: boolean;
  slug: string | null;
} | null> {
  try {
    const res = await fetch(
      `/api/orgs/${encodeURIComponent(orgId)}/bonfire-mapping`,
      { method: "GET" }
    );
    if (!res.ok) return null;
    return (await res.json()) as {
      bonfire_id: string | null;
      is_admin: boolean;
      slug: string | null;
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAutoOrgSwitch(): AutoOrgSwitchState {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { setActive } = useClerk();
  const { organization } = useOrganization();
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();

  // Extract primitive so dependency arrays compare by value, not object identity
  const activeOrgId = organization?.id ?? null;

  const [isOrgSwitching, setIsOrgSwitching] = useState(false);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>("loading");

  // Guard: only run the auto-switch once per subdomain visit
  const autoSwitchAttempted = useRef(false);
  // Track the org we auto-switched to so we can detect manual switches
  const autoSwitchedOrgId = useRef<string | null>(null);
  // Prevent redirect from firing during the initial auto-switch
  const initialSwitchComplete = useRef(false);
  // Prevent multiple concurrent redirects
  const isRedirecting = useRef(false);

  const bonfireId = subdomainConfig?.bonfireId ?? null;
  const isPublic = subdomainConfig?.isPublic ?? false;

  // ---------------------------------------------------------------------------
  // Manual org switch → redirect to the new bonfire's subdomain
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (
      !isSubdomainScoped ||
      !initialSwitchComplete.current ||
      isRedirecting.current
    )
      return;

    if (!activeOrgId || activeOrgId === autoSwitchedOrgId.current) return;

    // Ask the backend what bonfire this org maps to
    isRedirecting.current = true;
    resolveOrgBonfireMapping(activeOrgId).then((mapping) => {
      // Admin org or unmapped org — stay on current subdomain
      if (!mapping || mapping.is_admin || !mapping.bonfire_id) {
        autoSwitchedOrgId.current = activeOrgId;
        isRedirecting.current = false;
        return;
      }

      // Same bonfire as current subdomain — no redirect needed
      if (mapping.bonfire_id === bonfireId) {
        autoSwitchedOrgId.current = activeOrgId;
        isRedirecting.current = false;
        return;
      }

      // Different bonfire — redirect (use slug if available, otherwise bonfire ID)
      const subdomain = mapping.slug ?? mapping.bonfire_id;
      window.location.href = buildSubdomainUrl(subdomain);
    });
  }, [activeOrgId, isSubdomainScoped, bonfireId]);

  // ---------------------------------------------------------------------------
  // Reset refs when subdomain changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    autoSwitchAttempted.current = false;
    autoSwitchedOrgId.current = null;
    initialSwitchComplete.current = false;
    isRedirecting.current = false;
  }, [bonfireId]);

  // ---------------------------------------------------------------------------
  // Backend call: resolve which org to activate for this bonfire
  // ---------------------------------------------------------------------------
  const resolveViaBackend = useCallback(
    async (
      targetBonfireId: string
    ): Promise<{ org_id: string; is_admin: boolean } | null> => {
      try {
        const res = await fetch(
          `/api/bonfires/${encodeURIComponent(targetBonfireId)}/resolve-org`,
          { method: "GET" }
        );
        if (!res.ok) return null;
        return (await res.json()) as {
          org_id: string;
          is_admin: boolean;
        } | null;
      } catch {
        return null;
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Auto-switch: on subdomain load, resolve and activate the correct org
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // 1. Not subdomain-scoped → nothing to do
    if (!isSubdomainScoped || !bonfireId) {
      setAccessStatus("ok");
      return;
    }

    // Wait for auth to load
    if (!authLoaded) {
      setAccessStatus("loading");
      return;
    }

    // 2. Not signed in
    if (!isSignedIn) {
      setAccessStatus(isPublic ? "ok" : "sign_in_required");
      return;
    }

    // 3. Already attempted — don't loop
    if (autoSwitchAttempted.current) return;

    autoSwitchAttempted.current = true;
    setIsOrgSwitching(true);
    setAccessStatus("loading");

    // Ask the backend which org to activate for this bonfire
    resolveViaBackend(bonfireId).then(async (result) => {
      if (!result) {
        // No matching org — user has no access
        initialSwitchComplete.current = true;
        setAccessStatus(isPublic ? "ok" : "no_access");
        setIsOrgSwitching(false);
        return;
      }

      // Already on the correct org — nothing to switch
      if (activeOrgId === result.org_id) {
        autoSwitchedOrgId.current = result.org_id;
        initialSwitchComplete.current = true;
        setAccessStatus("ok");
        setIsOrgSwitching(false);
        return;
      }

      // Switch to the resolved org
      try {
        await setActive({ organization: result.org_id });
        autoSwitchedOrgId.current = result.org_id;
        initialSwitchComplete.current = true;
        setAccessStatus("ok");
      } catch {
        initialSwitchComplete.current = true;
        setAccessStatus(isPublic ? "ok" : "no_access");
      } finally {
        setIsOrgSwitching(false);
      }
    });
  }, [
    isSubdomainScoped,
    bonfireId,
    isPublic,
    authLoaded,
    isSignedIn,
    activeOrgId,
    setActive,
    resolveViaBackend,
  ]);

  return { isOrgSwitching, accessStatus };
}

export default useAutoOrgSwitch;
