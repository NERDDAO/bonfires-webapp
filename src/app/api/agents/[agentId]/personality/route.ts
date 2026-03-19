/**
 * Agent Personality API Route
 *
 * GET /api/agents/[agentId]/personality - Get personality traits
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ agentId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { agentId } = await params;
  if (!agentId) return createErrorResponse("Agent ID is required", 400);

  return handleProxyRequest(`/agents/${agentId}/personality`);
}

export function OPTIONS() {
  return handleCorsOptions();
}
