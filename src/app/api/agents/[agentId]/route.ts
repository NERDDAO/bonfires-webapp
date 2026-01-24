/**
 * Single Agent API Route
 *
 * GET /api/agents/[agentId] - Get agent details
 * PUT /api/agents/[agentId] - Update agent
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  parseJsonBody,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ agentId: string }>;
}

/**
 * GET /api/agents/[agentId]
 *
 * Get details of a specific agent.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { agentId } = await params;

  if (!agentId) {
    return createErrorResponse("Agent ID is required", 400);
  }

  return handleProxyRequest(`/agents/${agentId}`, {
    method: "GET",
  });
}

/**
 * PUT /api/agents/[agentId]
 *
 * Update an existing agent.
 *
 * Request Body:
 * - name?: string
 * - is_active?: boolean
 * - capabilities?: string[]
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { agentId } = await params;

  if (!agentId) {
    return createErrorResponse("Agent ID is required", 400);
  }

  const { data: body, error } = await parseJsonBody(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  return handleProxyRequest(`/agents/${agentId}`, {
    method: "PUT",
    body,
  });
}

/**
 * OPTIONS /api/agents/[agentId]
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
