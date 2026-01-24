/**
 * Graph Expand API Route
 *
 * POST /api/graph/expand - Expand graph from a node
 *
 * This endpoint proxies to /delve using center_node_uuid to expand
 * related nodes around a specific entity or episode.
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  parseJsonBody,
} from "@/lib/api/server-utils";
import type { DelveRequest, GraphExpandRequest } from "@/types";

/**
 * POST /api/graph/expand
 *
 * Expand the graph from a specific node to find related entities.
 *
 * Request Body:
 * - node_uuid: string (required) - UUID of the node to expand from
 * - bonfire_id?: string - Filter by bonfire
 * - depth?: number - How many levels to expand (default: 1)
 * - limit?: number - Maximum nodes to return
 */
export async function POST(request: NextRequest) {
  const { data: body, error } = await parseJsonBody<Partial<GraphExpandRequest>>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  // Validate required fields
  if (!body?.node_uuid) {
    return createErrorResponse("node_uuid is required", 400);
  }

  if (!body?.bonfire_id) {
    return createErrorResponse("bonfire_id is required", 400);
  }

  const expandRequest: DelveRequest = {
    query: "",
    bonfire_id: body.bonfire_id,
    center_node_uuid: body.node_uuid,
    num_results: body.limit ?? 50,
  };

  return handleProxyRequest("/delve", {
    method: "POST",
    body: expandRequest,
  });
}

/**
 * OPTIONS /api/graph/expand
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
