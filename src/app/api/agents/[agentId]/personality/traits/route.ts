/**
 * Agent Personality Traits API Route
 *
 * PUT    /api/agents/[agentId]/personality/traits - Add new traits
 * PATCH  /api/agents/[agentId]/personality/traits - Update existing traits
 * DELETE /api/agents/[agentId]/personality/traits - Delete traits by IDs
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { agentId } = await params;
  if (!agentId) return createErrorResponse("Agent ID is required", 400);

  const { data: body, error } = await parseJsonBody(request);
  if (error) return createErrorResponse(error, 400);

  return handleProxyRequest(`/agents/${agentId}/personality/traits`, {
    method: "PUT",
    body,
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { agentId } = await params;
  if (!agentId) return createErrorResponse("Agent ID is required", 400);

  const { data: body, error } = await parseJsonBody(request);
  if (error) return createErrorResponse(error, 400);

  return handleProxyRequest(`/agents/${agentId}/personality/traits`, {
    method: "PATCH",
    body,
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { agentId } = await params;
  if (!agentId) return createErrorResponse("Agent ID is required", 400);

  const { data: body, error } = await parseJsonBody(request);
  if (error) return createErrorResponse(error, 400);

  return handleProxyRequest(`/agents/${agentId}/personality/traits`, {
    method: "DELETE",
    body,
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
