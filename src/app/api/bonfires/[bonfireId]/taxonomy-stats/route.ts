/**
 * Bonfire Taxonomy Stats API Route
 *
 * GET /api/bonfires/[bonfireId]/taxonomy-stats - Get taxonomy stats for a bonfire
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ bonfireId: string }>;
}

/**
 * GET /api/bonfires/[bonfireId]/taxonomy-stats
 *
 * Proxies to /bonfire/{id}/taxonomy_stats on the backend.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { bonfireId } = await params;

  if (!bonfireId) {
    return createErrorResponse("Bonfire ID is required", 400);
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
