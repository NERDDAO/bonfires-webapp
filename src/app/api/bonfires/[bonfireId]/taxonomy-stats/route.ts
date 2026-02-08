/**
 * Bonfire Taxonomy Stats API Route
 *
 * GET /api/bonfires/[bonfireId]/taxonomy-stats - Get taxonomy stats for a bonfire (with access control)
 */
import { NextRequest } from "next/server";

import type { BonfireListResponse } from "@/types";

import {
  checkBonfireAccess,
  createAccessDeniedResponse,
} from "@/lib/api/bonfire-access";
import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
  proxyToBackend,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ bonfireId: string }>;
}

/**
 * GET /api/bonfires/[bonfireId]/taxonomy-stats
 *
 * Proxies to /bonfire/{id}/taxonomy_stats on the backend.
 * Checks access control - private bonfires require org membership.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { bonfireId } = await params;

  if (!bonfireId) {
    return createErrorResponse("Bonfire ID is required", 400);
  }

  // Fetch bonfire to check access
  const bonfireResponse = await proxyToBackend<BonfireListResponse>(
    "/bonfires",
    {
      method: "GET",
    }
  );

  const bonfire = bonfireResponse.data?.bonfires?.find(
    (b) => b.id === bonfireId
  );

  // Check access control
  const access = await checkBonfireAccess(bonfireId, bonfire?.is_public);
  if (!access.allowed) {
    const denied = createAccessDeniedResponse(access.reason);
    return createErrorResponse(denied.error, 403, denied.details, denied.code);
  }

  return handleProxyRequest(`/bonfire/${bonfireId}/taxonomy_stats`, {
    method: "GET",
  });
}

/**
 * OPTIONS /api/bonfires/[bonfireId]/taxonomy-stats
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
