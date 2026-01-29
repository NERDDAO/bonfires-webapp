/**
 * Graph Entity Expansion API Route
 *
 * POST /api/graph/expand/entity - Expand from an entity node
 *
 * This endpoint proxies to /knowledge_graph/expand/entity to retrieve
 * connected edges and nodes for a specific entity.
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  parseJsonBody,
} from "@/lib/api/server-utils";
import type { EntityExpandRequest } from "@/types";

/**
 * POST /api/graph/expand/entity
 *
 * Expand an entity node to retrieve its connected edges and nodes.
 *
 * Request Body:
 * - entity_uuid: string (required) - UUID of the entity to expand from
 * - bonfire_id: string (required) - Bonfire ID for scoping
 * - limit?: number - Maximum edges to return (default: 50)
 */
export async function POST(request: NextRequest) {
  const { data: body, error } = await parseJsonBody<EntityExpandRequest>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  // Validate required fields
  if (!body?.entity_uuid) {
    return createErrorResponse("entity_uuid is required", 400);
  }

  if (!body?.bonfire_id) {
    return createErrorResponse("bonfire_id is required", 400);
  }

  return handleProxyRequest("/knowledge_graph/expand/entity", {
    method: "POST",
    body,
  });
}

/**
 * OPTIONS /api/graph/expand/entity
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
