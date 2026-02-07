/**
 * Clerk Authentication Proxy
 *
 * Handles route protection for the application.
 * - Always public: Landing page, auth pages, public hyperblogs
 * - Always protected: Dashboard, documents, profile, bonfire settings
 * - Bonfire routes: Access control happens at API route level (is_public check)
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Routes that ALWAYS require authentication (regardless of bonfire visibility)
 */
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/documents(.*)",
  "/bonfire-settings(.*)",
  "/profile(.*)",
]);

/**
 * Routes that are ALWAYS public
 * Note: Bonfire-specific routes are NOT listed here - their access control
 * happens at the API route level based on the bonfire's is_public flag.
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/hyperblogs(.*)",
  "/api/hyperblogs(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Always protect these routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  // Public routes and bonfire-specific routes pass through
  // Bonfire access control (is_public check) happens at API route level

  // Forward ?subdomain= query param as a header for SubdomainResolver
  // Only on Vercel preview URLs (*.vercel.app) - blocked on production domains
  const host = req.headers.get("host") ?? "";
  const subdomainParam = req.nextUrl.searchParams.get("subdomain");
  if (subdomainParam && host.endsWith(".vercel.app")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-subdomain-override", subdomainParam);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
