/**
 * Graph Expand API Route
 *
 * POST /api/graph/expand - Expand graph from a node
 *
 * This endpoint proxies to the backend /knowledge_graph/episodes/expand
 * endpoint to load related nodes around a specific entity or episode.
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  parseJsonBody,
} from "@/lib/api/server-utils";
import type { GraphExpandRequest } from "@/types";

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

  const expandRequest = {
    episode_uuid: body.node_uuid,
    depth: body.depth ?? 1,
    limit: body.limit ?? 50,
    bonfire_id: body.bonfire_id,
  };

  return handleProxyRequest("/knowledge_graph/episodes/expand", {
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
