/**
 * Agent Env Var Delete API Route
 *
 * DELETE /api/agents/[agentId]/env-vars/[key] - Delete a specific env var
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ agentId: string; key: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { agentId, key } = await params;
  if (!agentId || !key)
    return createErrorResponse("Agent ID and key are required", 400);

  return handleProxyRequest(`/agents/${agentId}/env-vars/${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
