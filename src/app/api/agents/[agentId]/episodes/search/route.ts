/**
 * Agent Episodes Search API Route
 *
 * POST /api/agents/[agentId]/episodes/search - Fetch latest episodes for an agent
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  parseJsonBody,
} from "@/lib/api/server-utils";
import type { AgentEpisodesSearchRequest } from "@/types";

interface RouteParams {
  params: Promise<{ agentId: string }>;
}

/**
 * POST /api/agents/[agentId]/episodes/search
 *
 * Request Body:
 * - limit?: number - Max episodes to return (default: 10)
 * - before_time?: string - Upper bound for episode timestamps
 * - after_time?: string - Lower bound for episode timestamps
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { agentId } = await params;

  if (!agentId) {
    return createErrorResponse("Agent ID is required", 400);
  }

  const { data: body, error } = await parseJsonBody<AgentEpisodesSearchRequest>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  const searchRequest: AgentEpisodesSearchRequest = {
    limit: body?.limit ?? 10,
    before_time: body?.before_time,
    after_time: body?.after_time,
  };

  return handleProxyRequest(`/knowledge_graph/agents/${agentId}/episodes/search`, {
    method: "POST",
    body: searchRequest,
    timeout: 20000,
  });
}

/**
 * OPTIONS /api/agents/[agentId]/episodes/search
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
