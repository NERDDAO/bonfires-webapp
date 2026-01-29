/**
 * Node Episodes API Route
 *
 * GET /api/graph/node/[nodeUuid]/episodes - Get episodes for a node
 *
 * This endpoint proxies to /knowledge_graph/node/{node_uuid}/episodes
 * to retrieve episodes connected to a specific node.
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  extractQueryParams,
} from "@/lib/api/server-utils";

/**
 * GET /api/graph/node/[nodeUuid]/episodes
 *
 * Get episodes connected to a specific node.
 *
 * Path Parameters:
 * - nodeUuid: string (required) - UUID of the node
 *
 * Query Parameters:
 * - bonfire_id: string (required) - Bonfire ID for scoping
 * - limit?: number - Maximum episodes to return (default: 50)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nodeUuid: string }> }
) {
  const { nodeUuid } = await params;
  const queryParams = extractQueryParams(request, ["bonfire_id", "limit"]);

  // Validate required parameters
  if (!nodeUuid) {
    return createErrorResponse("nodeUuid path parameter is required", 400);
  }

  if (!queryParams.bonfire_id) {
    return createErrorResponse("bonfire_id query parameter is required", 400);
  }

  return handleProxyRequest(`/knowledge_graph/node/${nodeUuid}/episodes`, {
    method: "GET",
    queryParams: {
      bonfire_id: queryParams.bonfire_id,
      limit: queryParams.limit,
    },
  });
}

/**
 * OPTIONS /api/graph/node/[nodeUuid]/episodes
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
