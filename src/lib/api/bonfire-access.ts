/**
 * Bonfire Access Control
 *
 * Utilities for checking if a user can access a bonfire based on:
 * - Public bonfires (is_public: true) → accessible to everyone
 * - Private bonfires (is_public: false) → only accessible if user's Clerk org
 *   is mapped to the bonfire via ClerkOrgMapping (backend source of truth)
 */
import type { BonfireInfo } from "@/types";
import { auth } from "@clerk/nextjs/server";

import { proxyToBackend } from "@/lib/api/server-utils";

/**
 * Result of an access check
 */
export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  userId?: string | null;
  orgId?: string | null;
  userBonfireId?: string | null;
}

interface OrgBonfireMapping {
  bonfire_id: string | null;
  is_admin: boolean;
  slug: string | null;
}

/**
 * Get the bonfire ID that the current user's organization is linked to.
 *
 * Uses the backend ClerkOrgMapping collection (single source of truth).
 *
 * @returns The bonfire_id mapped to the user's active org, or null
 */
export async function getUserBonfireId(): Promise<string | null> {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return null;
    }

    const result = await proxyToBackend<OrgBonfireMapping>(
      `/orgs/${encodeURIComponent(orgId)}/bonfire-mapping`,
      { method: "GET", includeAuth: false }
    );

    if (!result.success || !result.data) {
      return null;
    }

    // Admin orgs have access to all bonfires — return a sentinel
    if (result.data.is_admin) {
      return "*";
    }

    return result.data.bonfire_id;
  } catch (error) {
    console.error("[Bonfire Access] Failed to get user bonfire ID:", error);
    return null;
  }
}

/**
 * Check if the current user can access a specific bonfire
 *
 * @param bonfireId - The bonfire ID to check access for
 * @param isPublic - Whether the bonfire is public (if known)
 * @returns AccessCheckResult with allowed status and reason
 */
export async function checkBonfireAccess(
  bonfireId: string,
  isPublic?: boolean
): Promise<AccessCheckResult> {
  const { userId, orgId } = await auth();
  const userBonfireId = await getUserBonfireId();

  // If we know it's public, allow access
  if (isPublic === true) {
    return {
      allowed: true,
      reason: "public_bonfire",
      userId,
      orgId,
      userBonfireId,
    };
  }

  // Admin org has access to all bonfires
  if (userBonfireId === "*") {
    return {
      allowed: true,
      reason: "admin_org",
      userId,
      orgId,
      userBonfireId,
    };
  }

  // If user's org is linked to this bonfire, allow access
  if (userBonfireId && userBonfireId === bonfireId) {
    return {
      allowed: true,
      reason: "org_member",
      userId,
      orgId,
      userBonfireId,
    };
  }

  // If we don't know if it's public, we need to assume it might be
  // The caller should provide isPublic when possible
  if (isPublic === undefined) {
    // Can't determine - deny by default for safety
    return {
      allowed: false,
      reason: "unknown_visibility",
      userId,
      orgId,
      userBonfireId,
    };
  }

  // Private bonfire and user doesn't have access
  return {
    allowed: false,
    reason: "not_org_member",
    userId,
    orgId,
    userBonfireId,
  };
}

/**
 * Filter a list of bonfires to only those the current user can access
 *
 * @param bonfires - List of bonfires to filter
 * @returns Filtered list of accessible bonfires
 */
export async function filterAccessibleBonfires(
  bonfires: BonfireInfo[]
): Promise<BonfireInfo[]> {
  const userBonfireId = await getUserBonfireId();

  return bonfires.filter((bonfire) => {
    // Public bonfires are accessible to everyone
    if (bonfire.is_public === true) {
      return true;
    }

    // Admin org can access all bonfires
    if (userBonfireId === "*") {
      return true;
    }

    // Private bonfires are only accessible if user's org matches
    if (userBonfireId && bonfire.id === userBonfireId) {
      return true;
    }

    // If is_public is undefined, treat as public for backward compatibility
    if (bonfire.is_public === undefined) {
      return true;
    }

    return false;
  });
}

/**
 * Validate that the user can access a bonfire by ID
 *
 * This is a convenience wrapper that fetches the bonfire info and checks access.
 * Use this when you only have the bonfire ID and need to validate access.
 *
 * @param bonfireId - The bonfire ID to validate
 * @param bonfireIsPublic - If known, whether the bonfire is public
 * @returns AccessCheckResult
 */
export async function validateBonfireAccess(
  bonfireId: string,
  bonfireIsPublic?: boolean
): Promise<AccessCheckResult> {
  // If we know the visibility, use it directly
  if (bonfireIsPublic !== undefined) {
    return checkBonfireAccess(bonfireId, bonfireIsPublic);
  }

  // Otherwise, we need to check if user has org access
  const userBonfireId = await getUserBonfireId();
  const { userId, orgId } = await auth();

  // Admin org can access all bonfires
  if (userBonfireId === "*") {
    return {
      allowed: true,
      reason: "admin_org",
      userId,
      orgId,
      userBonfireId,
    };
  }

  // If user's org matches this bonfire, they have access
  if (userBonfireId && userBonfireId === bonfireId) {
    return {
      allowed: true,
      reason: "org_member",
      userId,
      orgId,
      userBonfireId,
    };
  }

  // Without knowing if it's public, we can't grant access
  // The caller should fetch bonfire info to determine is_public
  return {
    allowed: false,
    reason: "access_check_required",
    userId,
    orgId,
    userBonfireId,
  };
}

/**
 * Create a 403 Forbidden response for access denied
 */
export function createAccessDeniedResponse(reason?: string) {
  return {
    error: "Access denied",
    details: reason ?? "You do not have permission to access this bonfire",
    code: "BONFIRE_ACCESS_DENIED",
  };
}

/**
 * Validate bonfire access for a request that includes bonfire_id
 *
 * This is a simple check that validates the user can access the specified bonfire.
 * Used for routes that take bonfire_id as a parameter.
 *
 * @param bonfireId - The bonfire ID from the request
 * @returns AccessCheckResult
 */
export async function validateBonfireIdParam(
  bonfireId: string | undefined | null
): Promise<AccessCheckResult> {
  if (!bonfireId) {
    return {
      allowed: true, // No bonfire_id means no filtering needed
      reason: "no_bonfire_filter",
    };
  }

  const userBonfireId = await getUserBonfireId();
  const { userId, orgId } = await auth();

  // Admin org can access all bonfires
  if (userBonfireId === "*") {
    return {
      allowed: true,
      reason: "admin_org",
      userId,
      orgId,
      userBonfireId,
    };
  }

  // If user's org matches this bonfire, they have access
  if (userBonfireId && userBonfireId === bonfireId) {
    return {
      allowed: true,
      reason: "org_member",
      userId,
      orgId,
      userBonfireId,
    };
  }

  // User is trying to access a different bonfire than their org
  // We can't know if it's public without fetching, so we need to check
  // For now, we'll need to fetch bonfire info in the route
  return {
    allowed: false,
    reason: "bonfire_mismatch",
    userId,
    orgId,
    userBonfireId,
  };
}
