/**
 * AuthGuard Component
 *
 * Guards content behind authentication.
 * Shows a sign-in prompt if user is not authenticated.
 *
 * Similar pattern to WalletConnectionGuard but for Clerk auth.
 */
"use client";

import { SignInButton } from "@clerk/nextjs";

import { useAuth } from "@/hooks/useAuth";

/**
 * AuthGuard Component
 *
 * Guards content behind authentication.
 * Shows a sign-in prompt if user is not authenticated.
 *
 * Similar pattern to WalletConnectionGuard but for Clerk auth.
 */

interface AuthGuardProps {
  /** Title shown when not authenticated */
  title?: string;
  /** Description shown when not authenticated */
  description?: string;
  /** Content to show when authenticated */
  children: React.ReactNode;
  /** Optional: Require specific organization membership */
  requireOrg?: boolean;
  /** Optional: Message when org is required but not selected */
  orgRequiredMessage?: string;
}

/**
 * AuthGuard Component
 *
 * Wraps content that requires authentication.
 * Shows a sign-in card if user is not authenticated.
 */
export function AuthGuard({
  title = "Sign In Required",
  description = "Please sign in to continue.",
  children,
  requireOrg = false,
  orgRequiredMessage = "Please select a bonfire to continue.",
}: AuthGuardProps) {
  const { isSignedIn, isLoaded, organization } = useAuth();

  // Show loading skeleton while checking auth
  if (!isLoaded) {
    return (
      <div className="card bg-base-200 shadow-xl animate-pulse">
        <div className="card-body items-center">
          <div className="h-6 w-32 bg-base-300 rounded" />
          <div className="h-4 w-48 bg-base-300 rounded mt-2" />
          <div className="h-10 w-24 bg-base-300 rounded mt-4" />
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title">{title}</h2>
          <p className="opacity-70 mb-4">{description}</p>
          <SignInButton mode="modal">
            <button className="btn btn-primary">Sign In</button>
          </SignInButton>
        </div>
      </div>
    );
  }

  // Check if organization is required but not selected
  if (requireOrg && !organization) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Select a Bonfire</h2>
          <p className="opacity-70 mb-4">{orgRequiredMessage}</p>
          <p className="text-sm text-base-content/50">
            Use the organization switcher in the header to select a bonfire.
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated (and has org if required)
  return <>{children}</>;
}

export default AuthGuard;
