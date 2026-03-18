/**
 * Agent Chat Config API Route
 *
 * GET /api/agents/[agentId]/chat-config - Get chat configuration
 * PUT /api/agents/[agentId]/chat-config - Update chat configuration
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

  return handleProxyRequest(`/agents/${agentId}/chat-config`);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { agentId } = await params;
  if (!agentId) return createErrorResponse("Agent ID is required", 400);

  const { data: body, error } = await parseJsonBody(request);
  if (error) return createErrorResponse(error, 400);

  return handleProxyRequest(`/agents/${agentId}/chat-config`, {
    method: "PUT",
    body,
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
