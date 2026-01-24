/**
 * Single Bonfire API Route
 *
 * GET /api/bonfires/[bonfireId] - Get bonfire details
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
 * GET /api/bonfires/[bonfireId]
 *
 * Get details of a specific bonfire including taxonomy stats.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { bonfireId } = await params;

  if (!bonfireId) {
    return createErrorResponse("Bonfire ID is required", 400);
  }

  // The backend has taxonomy_stats endpoint for bonfire details
  return handleProxyRequest(`/bonfire/${bonfireId}/taxonomy_stats`, {
    method: "GET",
  });
}

/**
 * OPTIONS /api/bonfires/[bonfireId]
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
