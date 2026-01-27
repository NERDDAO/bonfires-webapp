/**
 * Authentication Types
 *
 * TypeScript interfaces for Clerk authentication and authorization.
 */

/**
 * Bonfire-specific organization roles
 * Configured in Clerk Dashboard > Organization Settings > Roles
 */
export type BonfireRole =
  | "org:bonfire_admin" // System super admin - can delete bonfires
  | "org:bonfire_manager" // Client - can manage members, cannot delete
  | "org:bonfire_member"; // End user - read-only access

/**
 * Authenticated user information
 */
export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

/**
 * Organization (Bonfire) information from Clerk
 */
export interface AuthOrganization {
  id: string;
  name: string;
  slug: string | null;
  /** MongoDB bonfire ID stored in publicMetadata */
  bonfireId?: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  user: AuthUser | null;
  organization: AuthOrganization | null;
  orgRole: BonfireRole | null;
  isSignedIn: boolean;
  isLoaded: boolean;
}

/**
 * Role permission definitions
 */
export const ROLE_PERMISSIONS = {
  "org:bonfire_admin": {
    canDeleteBonfire: true,
    canManageMembers: true,
    canInviteUsers: true,
    canReadMembers: true,
  },
  "org:bonfire_manager": {
    canDeleteBonfire: false,
    canManageMembers: true,
    canInviteUsers: true,
    canReadMembers: true,
  },
  "org:bonfire_member": {
    canDeleteBonfire: false,
    canManageMembers: false,
    canInviteUsers: false,
    canReadMembers: true,
  },
} as const;

/**
 * Check if a role can manage members (invite, promote, remove)
 */
export function canManageMembers(role: BonfireRole | null): boolean {
  if (!role) return false;
  return role === "org:bonfire_admin" || role === "org:bonfire_manager";
}

/**
 * Check if a role is a manager or admin
 */
export function isManager(role: BonfireRole | null): boolean {
  return role === "org:bonfire_manager" || role === "org:bonfire_admin";
}

/**
 * Check if a role is an admin (system super admin)
 */
export function isAdmin(role: BonfireRole | null): boolean {
  return role === "org:bonfire_admin";
}
