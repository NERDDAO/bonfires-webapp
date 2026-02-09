/**
 * useAuth Hook
 *
 * Provides authentication state from Clerk with typed organization roles and permissions.
 * Wraps Clerk's useUser, useOrganization, and useAuth hooks for convenience.
 */
"use client";

import type { AuthState, BonfirePermission, BonfireRole } from "@/types";
import {
  useAuth as useClerkAuth,
  useOrganization,
  useUser,
} from "@clerk/nextjs";

/**
 * useAuth Hook
 *
 * Provides authentication state from Clerk with typed organization roles and permissions.
 * Wraps Clerk's useUser, useOrganization, and useAuth hooks for convenience.
 */

/**
 * Hook for accessing authentication state
 *
 * @returns Authentication state including user, organization, role, and permission checks
 */
export function useAuth(): AuthState & {
  /** Check if user has a specific role */
  hasRole: (role: BonfireRole) => boolean;
  /** Check if user has a specific permission */
  hasPermission: (permission: BonfirePermission) => boolean;
  /** Check if user can create datarooms (has org:bonfire:write permission) */
  canCreateDataRoom: boolean;
} {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { organization, membership, isLoaded: orgLoaded } = useOrganization();
  const { has } = useClerkAuth();

  const isLoaded = userLoaded && orgLoaded;
  const orgRole = (membership?.role as BonfireRole) ?? null;

  const hasRole = (role: BonfireRole): boolean => {
    return orgRole === role;
  };

  const hasPermission = (permission: BonfirePermission): boolean => {
    return has?.({ permission }) ?? false;
  };

  // Check for org:bonfire:write permission
  const canCreateDataRoom = hasPermission("org:bonfire:write");

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
        }
      : null,
    orgRole,
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    hasRole,
    hasPermission,
    canCreateDataRoom,
  };
}

export default useAuth;
