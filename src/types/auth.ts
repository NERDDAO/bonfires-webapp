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
 * Bonfire-specific organization permissions
 *
 * Permissions are assigned to roles and appear in the JWT's org_permissions array.
 * Use the `hasPermission()` function from `useAuth` hook to check permissions.
 */
export type BonfirePermission = "org:bonfire:write"; // Can create datarooms, manage content

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
