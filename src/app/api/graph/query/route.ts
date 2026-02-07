/**
 * Graph Query API Route
 *
 * POST /api/graph/query - Execute a graph query (delve search) with access control
 *
 * This endpoint proxies to the backend /delve endpoint for semantic
 * graph searches. For long-running queries, the backend may return
 * a job ID for async polling.
 */
import { NextRequest } from "next/server";

import type { BonfireListResponse, DelveRequest } from "@/types";

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
 * POST /api/graph/query
 *
 * Execute a semantic graph query.
 * Validates bonfire access before executing.
 *
 * Request Body:
 * - bonfire_id: string (required) - Filter by bonfire (access control applied)
 * - query?: string - The search query
 * - num_results?: number - Maximum results to return
 * - center_node_uuid?: string - Center the query on a specific node
 * - graph_id?: string - Use existing graph context
 */
export async function POST(request: NextRequest) {
  const { data: body, error } =
    await parseJsonBody<Partial<DelveRequest>>(request);

  if (error) {
    return createErrorResponse(error, 400);
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

  const delveRequest: DelveRequest = {
    query: body.query ?? "",
    bonfire_id: body.bonfire_id,
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
