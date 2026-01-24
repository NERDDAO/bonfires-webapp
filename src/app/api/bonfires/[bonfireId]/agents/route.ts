/**
 * Bonfire Agents API Route
 *
 * GET /api/bonfires/[bonfireId]/agents - List agents for a bonfire
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  extractQueryParams,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ bonfireId: string }>;
}

/**
 * GET /api/bonfires/[bonfireId]/agents
 *
 * Get all agents belonging to a specific bonfire.
 *
 * Query Parameters:
 * - active_only: If "true", only return active agents
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { bonfireId } = await params;

  if (!bonfireId) {
    return createErrorResponse("Bonfire ID is required", 400);
  }

  const queryParams = extractQueryParams(request, ["active_only"]);

  return handleProxyRequest("/agents", {
    method: "GET",
    queryParams: {
      bonfire_id: bonfireId,
      active_only: queryParams["active_only"] === "true",
    },
  });
}

/**
 * OPTIONS /api/bonfires/[bonfireId]/agents
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
