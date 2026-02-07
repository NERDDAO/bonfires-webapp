/**
 * Graph Search API Route
 *
 * POST /api/graph/search - Search for entities in the knowledge graph (with access control)
 *
 * This endpoint proxies to the backend vector search endpoint for
 * semantic search over chunks.
 */
import { NextRequest } from "next/server";

import type {
  BonfireListResponse,
  GraphSearchRequest,
  VectorSearchRequest,
} from "@/types";

import {
  checkBonfireAccess,
  createAccessDeniedResponse,
} from "@/lib/api/bonfire-access";
import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
  parseJsonBody,
  proxyToBackend,
} from "@/lib/api/server-utils";

/**
 * POST /api/graph/search
 *
 * Search for entities in the knowledge graph using semantic search.
 * Validates bonfire access before executing.
 *
 * Request Body:
 * - query: string (required) - The search query
 * - bonfire_id: string (required) - Filter by bonfire (access control applied)
 * - limit?: number - Maximum results to return (default: 10)
 * - filters?: object - Additional filters
 */
export async function POST(request: NextRequest) {
  const { data: body, error } =
    await parseJsonBody<Partial<GraphSearchRequest>>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  if (!body?.query) {
    return createErrorResponse("query is required", 400);
  }
  if (!body?.bonfire_id) {
    return createErrorResponse("bonfire_id is required", 400);
  }

  // Check bonfire access
  const bonfireResponse = await proxyToBackend<BonfireListResponse>(
    "/bonfires",
    {
      method: "GET",
    }
  );

  const bonfire = bonfireResponse.data?.bonfires?.find(
    (b) => b.id === body.bonfire_id
  );

  const access = await checkBonfireAccess(body.bonfire_id, bonfire?.is_public);
  if (!access.allowed) {
    const denied = createAccessDeniedResponse(access.reason);
    return createErrorResponse(denied.error, 403, denied.details, denied.code);
  }

  const searchRequest: VectorSearchRequest = {
    bonfire_ref: body.bonfire_id,
    search_string: body.query,
    limit: body.limit ?? 10,
  };

  return handleProxyRequest("/vector_store/search", {
    method: "POST",
    body: searchRequest,
  });
}

/**
 * OPTIONS /api/graph/search
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
