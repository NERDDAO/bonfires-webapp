/**
 * Agent Skills API Route
 *
 * GET /api/agents/[agentId]/skills - Get enabled skills
 * PUT /api/agents/[agentId]/skills - Update enabled skills
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
  parseJsonBody,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ agentId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { agentId } = await params;
  if (!agentId) return createErrorResponse("Agent ID is required", 400);

  return handleProxyRequest(`/agents/${agentId}/skills`);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { agentId } = await params;
  if (!agentId) return createErrorResponse("Agent ID is required", 400);

  const { data: body, error } = await parseJsonBody(request);
  if (error) return createErrorResponse(error, 400);

  return handleProxyRequest(`/agents/${agentId}/skills`, {
    method: "PUT",
    body,
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
