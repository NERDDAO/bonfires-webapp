/**
 * Agent Personality Replace API Route
 *
 * PUT /api/agents/[agentId]/personality/replace - Replace entire personality
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

  return handleProxyRequest(`/agents/${agentId}/personality/replace`, {
    method: "PUT",
    body,
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
