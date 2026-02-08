/**
 * Org → Bonfire Mapping Route
 *
 * GET /api/orgs/[orgId]/bonfire-mapping
 *
 * Looks up which bonfire a Clerk org is mapped to using our ClerkOrgMapping
 * collection (single source of truth). Used by the frontend to determine
 * where to redirect when a user manually switches org.
 */
import { NextResponse } from "next/server";

import {
  CORS_HEADERS,
  createErrorResponse,
  handleCorsOptions,
  proxyToBackend,
} from "@/lib/api/server-utils";

/** Cache TTL in seconds — controls shared (CDN/edge) cache via s-maxage */
const CACHE_MAX_AGE = 300; // 5 minutes

interface OrgBonfireMappingResponse {
  bonfire_id: string | null;
  is_admin: boolean;
  slug: string | null;
}

interface RouteParams {
  params: Promise<{ orgId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { orgId } = await params;

  if (!orgId) {
    return createErrorResponse("Org ID is required", 400);
  }

  const result = await proxyToBackend<OrgBonfireMappingResponse>(
    `/orgs/${encodeURIComponent(orgId)}/bonfire-mapping`,
    { method: "GET" }
  );

  if (!result.success) {
    return createErrorResponse(
      result.error?.error ?? "Failed to look up org mapping",
      result.status,
      result.error?.details,
      result.error?.code
    );
  }

  return NextResponse.json(result.data, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE * 2}`,
    },
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
