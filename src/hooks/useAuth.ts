/**
 * useAuth Hook
 *
 * Provides authentication state from Clerk with typed organization roles.
 * Wraps Clerk's useUser and useOrganization hooks for convenience.
 */

"use client";

import { useUser, useOrganization } from "@clerk/nextjs";
import type { BonfireRole, AuthState } from "@/types";

/**
 * Hook for accessing authentication state
 *
 * @returns Authentication state including user, organization, and role
 */
export function useAuth(): AuthState & {
  /** Check if user has a specific role */
  hasRole: (role: BonfireRole) => boolean;
  /** Check if user can manage members (manager or admin) */
  canManageMembers: boolean;
} {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { organization, membership, isLoaded: orgLoaded } = useOrganization();

  const isLoaded = userLoaded && orgLoaded;
  const orgRole = (membership?.role as BonfireRole) ?? null;

  const hasRole = (role: BonfireRole): boolean => {
    return orgRole === role;
  };

  const canManageMembers =
    orgRole === "org:bonfire_admin" || orgRole === "org:bonfire_manager";

  return {
    user: user
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        }
      : null,
    organization: organization
      ? {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          bonfireId: (organization.publicMetadata?.["bonfire_id"] as string) ?? undefined,
        }
      : null,
    orgRole,
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    hasRole,
    canManageMembers,
  };
}

export default useAuth;
