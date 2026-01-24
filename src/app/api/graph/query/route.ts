/**
 * Graph Query API Route
 *
 * POST /api/graph/query - Execute a graph query (delve search)
 *
 * This endpoint proxies to the backend /delve endpoint for semantic
 * graph searches. For long-running queries, the backend may return
 * a job ID for async polling.
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  parseJsonBody,
} from "@/lib/api/server-utils";
import type { DelveRequest } from "@/types";

/**
 * POST /api/graph/query
 *
 * Execute a semantic graph query.
 *
 * Request Body:
 * - query: string (required) - The search query
 * - bonfire_id?: string - Filter by bonfire
 * - agent_config_id?: string - Use specific agent config
 * - num_results?: number - Maximum results to return
 * - center_node_uuid?: string - Center the query on a specific node
 * - graph_id?: string - Use existing graph context
 */
export async function POST(request: NextRequest) {
  const { data: body, error } = await parseJsonBody<Partial<DelveRequest>>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  // Validate required fields
  if (!body?.query) {
    return createErrorResponse("query is required", 400);
  }

  const delveRequest: DelveRequest = {
    query: body.query,
    bonfire_id: body.bonfire_id,
    agent_config_id: body.agent_config_id,
    num_results: body.num_results ?? 10,
    center_node_uuid: body.center_node_uuid,
    graph_id: body.graph_id,
  };

  return handleProxyRequest("/delve", {
    method: "POST",
    body: delveRequest,
  });
}

/**
 * OPTIONS /api/graph/query
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
