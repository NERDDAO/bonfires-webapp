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
 * - active_only: If "true", only return active agents (not supported by backend)
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { bonfireId } = await params;

  if (!bonfireId) {
    return createErrorResponse("Bonfire ID is required", 400);
  }

  return handleProxyRequest(`/bonfires/${bonfireId}/agents`, {
    method: "GET",
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
