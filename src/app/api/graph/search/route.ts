/**
 * Graph Search API Route
 *
 * POST /api/graph/search - Search for entities in the knowledge graph
 *
 * This endpoint proxies to the backend vector search endpoint for
 * semantic search over chunks.
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  parseJsonBody,
} from "@/lib/api/server-utils";
import type { GraphSearchRequest, VectorSearchRequest } from "@/types";

/**
 * POST /api/graph/search
 *
 * Search for entities in the knowledge graph using semantic search.
 *
 * Request Body:
 * - query: string (required) - The search query
 * - bonfire_id?: string - Filter by bonfire
 * - limit?: number - Maximum results to return (default: 10)
 * - filters?: object - Additional filters
 */
export async function POST(request: NextRequest) {
  const { data: body, error } = await parseJsonBody<Partial<GraphSearchRequest>>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  if (!body?.query) {
    return createErrorResponse("query is required", 400);
  }
  if (!body?.bonfire_id) {
    return createErrorResponse("bonfire_id is required", 400);
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
