/**
 * Clerk Authentication Proxy
 *
 * Handles route protection for the application.
 * - Always public: Landing page, auth pages, public hyperblogs
 * - Always protected: Dashboard, documents, profile, bonfire settings
 * - Bonfire routes: Access control happens at API route level (is_public check)
 */
import { NextResponse } from "next/server";

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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

  // Subdomain override for Vercel preview URLs and local development.
  // Uses ?subdomain= param on first visit, then persists via cookie.
  // Clear with ?subdomain= (empty value) to return to root domain view.
  //
  // Examples:
  //   http://localhost:3000?subdomain=boulder   → bonfire subdomain
  //   http://localhost:3000?subdomain=          → clears override, root view
  const host = req.headers.get("host") ?? "";
  const isLocalhost =
    host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const isVercelPreview = host.endsWith(".vercel.app");

  if (isVercelPreview || isLocalhost) {
    const subdomainParam = req.nextUrl.searchParams.get("subdomain");
    const subdomainCookie = req.cookies.get("x-subdomain-override")?.value;

    // Explicit empty ?subdomain= clears the cookie
    if (subdomainParam !== null && subdomainParam === "") {
      const response = NextResponse.next();
      response.cookies.delete("x-subdomain-override");
      return response;
    }

    const subdomain = subdomainParam ?? subdomainCookie;

    if (subdomain) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-subdomain-override", subdomain);
      const response = NextResponse.next({
        request: { headers: requestHeaders },
      });
      if (subdomainParam) {
        response.cookies.set("x-subdomain-override", subdomainParam, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24, // 1 day
        });
      }
      return response;
    }

    return NextResponse.next();
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
