"use client";

import { useEffect, useRef } from "react";

import { useRouter } from "next/navigation";

import { useAuth, useOrganization } from "@clerk/nextjs";

import { resolveOrgBonfireMapping } from "@/lib/utils/resolve-org-bonfire";
import { buildSubdomainUrl } from "@/lib/utils/subdomain";

/**
 * Accept-Invitation Landing Page
 *
 * Users land here after clicking a Clerk invitation email link and
 * completing sign-in/sign-up. Clerk auto-activates the invited org,
 * so we read the active org, resolve its bonfire subdomain, and redirect.
 *
 * Falls back to /dashboard if no bonfire mapping is found.
 */
export default function AcceptInvitationPage() {
  const { isLoaded: authLoaded, isSignedIn, orgId } = useAuth();
  const { isLoaded: orgLoaded } = useOrganization();
  const router = useRouter();
  const redirectAttempted = useRef(false);

  useEffect(() => {
    if (!authLoaded || !orgLoaded) return;

    // Not signed in — shouldn't happen in normal flow, but redirect to sign-in
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }

    // No active org — redirect to dashboard
    if (!orgId) {
      router.replace("/dashboard");
      return;
    }

    // Only attempt redirect once
    if (redirectAttempted.current) return;
    redirectAttempted.current = true;

    resolveOrgBonfireMapping(orgId).then((mapping) => {
      if (!mapping || !mapping.bonfire_id) {
        router.replace("/dashboard");
        return;
      }

      const subdomain = mapping.slug ?? mapping.bonfire_id;
      window.location.href = buildSubdomainUrl(subdomain);
    });
  }, [authLoaded, orgLoaded, isSignedIn, orgId, router]);

  return (
    <div className="flex items-center justify-center h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-5rem)]">
      <div className="flex flex-col items-center gap-4">
        <span className="loading loading-spinner loading-lg text-white" />
        <p className="text-sm text-base-content/60">
          Joining bonfire&hellip; Redirecting you now.
        </p>
      </div>
    </div>
  );
}
