/**
 * useAgentConfigAccess Hook
 *
 * Determines whether the current user can access the Agent Config page.
 *
 * Access is granted when:
 * 1. User is signed in
 * 2. User has org:bonfire_admin or org:bonfire_manager role in their active Clerk org
 * 3. AND one of:
 *    a. The active org maps to the current subdomain's bonfire (regular admin/manager)
 *    b. The active org has is_admin=true (super admin — access on ALL subdomains)
 *
 * On root domain (not subdomain-scoped), access is granted by role alone (matches
 * the existing behavior of the agent-config page guard).
 */
"use client";

import { useQuery } from "@tanstack/react-query";

import { useSubdomainBonfire } from "@/contexts/SubdomainBonfireContext";
import type { OrgBonfireMapping } from "@/lib/utils/resolve-org-bonfire";

import { useAuth } from "./useAuth";

interface AgentConfigAccess {
  /** Whether the user can access Agent Config on the current subdomain */
  canAccess: boolean;
  /** True while resolving org mapping */
  isLoading: boolean;
}

export function useAgentConfigAccess(): AgentConfigAccess {
  const { isSignedIn, orgRole, organization, isLoaded } = useAuth();
  const { isSubdomainScoped, subdomainConfig } = useSubdomainBonfire();

  const orgId = organization?.id ?? null;
  const isAdminOrManager =
    orgRole === "org:bonfire_admin" || orgRole === "org:bonfire_manager";

  // Fetch org → bonfire mapping to check is_admin.
  // On subdomain, we need to know if the user's org is an admin org or maps to
  // the current bonfire. On root domain the query stays disabled.
  const queryEnabled = !!orgId && isAdminOrManager && isSubdomainScoped;
  const {
    data: mapping,
    isPending: isMappingPending,
    isFetching: isMappingFetching,
  } = useQuery({
    queryKey: ["org-bonfire-mapping", orgId],
    queryFn: async () => {
      const res = await fetch(
        `/api/orgs/${encodeURIComponent(orgId!)}/bonfire-mapping`,
      );
      if (!res.ok) return null;
      return (await res.json()) as OrgBonfireMapping;
    },
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
  });

  if (!isLoaded) return { canAccess: false, isLoading: true };
  if (!isSignedIn || !isAdminOrManager) {
    return { canAccess: false, isLoading: false };
  }

  // Root domain: role check is sufficient (existing behavior)
  if (!isSubdomainScoped) {
    return { canAccess: true, isLoading: false };
  }

  // Subdomain: wait for mapping data to arrive.
  // isPending covers both "query disabled/idle" and "first fetch in progress".
  // isFetching catches the transition between enabled becoming true and data arriving.
  if (isMappingPending || isMappingFetching) {
    return { canAccess: false, isLoading: true };
  }

  // Super admin org → access on all subdomains
  if (mapping?.is_admin) return { canAccess: true, isLoading: false };

  // Regular org → only if it maps to this subdomain's bonfire
  const currentBonfireId = subdomainConfig?.bonfireId ?? null;
  const orgBonfireId = mapping?.bonfire_id ?? null;
  const canAccess = !!currentBonfireId && currentBonfireId === orgBonfireId;

  return { canAccess, isLoading: false };
}

export default useAgentConfigAccess;
