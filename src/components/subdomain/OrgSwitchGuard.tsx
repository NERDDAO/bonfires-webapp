/**
 * OrgSwitchGuard
 *
 * Client component that wraps page content and gates rendering based on
 * the auto-org-switch status. Shows appropriate UI for:
 *   - "loading"          → spinner while switching or resolving
 *   - "sign_in_required" → prompt to sign in (private bonfire, unauthenticated)
 *   - "no_access"        → access denied message
 *   - "ok"               → render children normally
 */
"use client";

import type { ReactNode } from "react";

import { SignInButton } from "@clerk/nextjs";

import { useSubdomainBonfire } from "@/contexts/SubdomainBonfireContext";

import { useAutoOrgSwitch } from "@/hooks/useAutoOrgSwitch";

/**
 * OrgSwitchGuard
 *
 * Client component that wraps page content and gates rendering based on
 * the auto-org-switch status. Shows appropriate UI for:
 *   - "loading"          → spinner while switching or resolving
 *   - "sign_in_required" → prompt to sign in (private bonfire, unauthenticated)
 *   - "no_access"        → access denied message
 *   - "ok"               → render children normally
 */

interface OrgSwitchGuardProps {
  children: ReactNode;
}

const containerClass = "flex items-center justify-center h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-5rem)]";

export function OrgSwitchGuard({ children }: OrgSwitchGuardProps) {
  const { isSubdomainScoped } = useSubdomainBonfire();
  const { accessStatus, isOrgSwitching } = useAutoOrgSwitch();

  // Not on a subdomain — pass through immediately
  if (!isSubdomainScoped) {
    return <>{children}</>;
  }

  if (accessStatus === "loading" || isOrgSwitching) {
    return (
      <div className={containerClass}>
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-white" />
          <p className="text-sm text-base-content/60">
            Loading bonfire&hellip;
          </p>
        </div>
      </div>
    );
  }

  if (accessStatus === "sign_in_required") {
    return (
      <div className={containerClass}>
        <div className="card bg-base-200 shadow-xl max-w-md w-full">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-lg">Sign In Required</h2>
            <p className="text-sm text-base-content/70 mb-4">
              This bonfire requires you to sign in before you can access its
              content.
            </p>
            <SignInButton mode="modal">
              <button className="btn btn-primary" type="button">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  if (accessStatus === "no_access") {
    return (
      <div className={containerClass}>
        <div className="card bg-base-200 shadow-xl max-w-md w-full">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-lg">Access Denied</h2>
            <p className="text-sm text-base-content/70">
              You don&apos;t have access to this bonfire. Please request access
              from the Bonfire Manager.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
