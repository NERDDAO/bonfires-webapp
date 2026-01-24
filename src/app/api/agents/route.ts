/**
 * Agents API Route
 *
 * GET /api/agents - List agents (with optional filters)
 * POST /api/agents - Create a new agent
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  parseJsonBody,
  extractQueryParams,
} from "@/lib/api/server-utils";

/**
 * GET /api/agents
 *
 * List agents with optional filtering by bonfire, username, or active status.
 *
 * Query Parameters:
 * - bonfire_id: Filter by bonfire ID
 * - username: Filter by username
 * - active_only: If "true", only return active agents
 */
export async function GET(request: NextRequest) {
  const params = extractQueryParams(request, [
    "bonfire_id",
    "username",
    "active_only",
  ]);

  const queryParams: Record<string, string | boolean | undefined> = {};

  if (params["bonfire_id"]) {
    queryParams["bonfire_id"] = params["bonfire_id"];
  }
  if (params["username"]) {
    queryParams["username"] = params["username"];
  }
  if (params["active_only"] !== undefined) {
    queryParams["active_only"] = params["active_only"] === "true";
  }

  return handleProxyRequest("/agents", {
    method: "GET",
    queryParams,
  });
}

/**
 * POST /api/agents
 *
 * Create a new agent.
 *
 * Request Body:
 * - username: string (required)
 * - name: string (required)
 * - bonfire_id?: string
 * - capabilities?: string[]
 */
export async function POST(request: NextRequest) {
  const { data: body, error } = await parseJsonBody<{
    username?: string;
    name?: string;
    bonfire_id?: string;
    capabilities?: string[];
  }>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  // Validate required fields
  if (!body?.username) {
    return createErrorResponse("username is required", 400);
  }
  if (!body?.name) {
    return createErrorResponse("name is required", 400);
  }

  return handleProxyRequest("/agents", {
    method: "POST",
    body,
  }, 201);
}

/**
 * OPTIONS /api/agents
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
