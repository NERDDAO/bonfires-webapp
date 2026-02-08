/**
 * Agent Episodes Search API Route
 *
 * POST /api/agents/[agentId]/episodes/search - Fetch latest episodes for an agent (with access control)
 */
import { NextRequest } from "next/server";

import type {
  AgentEpisodesSearchRequest,
  AgentInfo,
  BonfireListResponse,
} from "@/types";

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

interface RouteParams {
  params: Promise<{ agentId: string }>;
}

/**
 * POST /api/agents/[agentId]/episodes/search
 *
 * Fetch latest episodes for an agent.
 * Checks access based on the agent's bonfire.
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

  // Fetch agent to check bonfire access
  const agentResponse = await proxyToBackend<AgentInfo>(`/agents/${agentId}`, {
    method: "GET",
  });

  if (!agentResponse.success || !agentResponse.data) {
    return createErrorResponse("Agent not found", 404);
  }

  const bonfireId = agentResponse.data.bonfire_id;

  if (bonfireId) {
    // Fetch bonfire to check is_public
    const bonfireResponse = await proxyToBackend<BonfireListResponse>(
      "/bonfires",
      {
        method: "GET",
      }
    );

    const bonfire = bonfireResponse.data?.bonfires?.find(
      (b) => b.id === bonfireId
    );

    const access = await checkBonfireAccess(bonfireId, bonfire?.is_public);
    if (!access.allowed) {
      const denied = createAccessDeniedResponse(access.reason);
      return createErrorResponse(
        denied.error,
        403,
        denied.details,
        denied.code
      );
    }
  }

  const { data: body, error } =
    await parseJsonBody<AgentEpisodesSearchRequest>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  const searchRequest: AgentEpisodesSearchRequest = {
    limit: body?.limit ?? 10,
    before_time: body?.before_time,
    after_time: body?.after_time,
  };

  return handleProxyRequest(
    `/knowledge_graph/agents/${agentId}/episodes/search`,
    {
      method: "POST",
      body: searchRequest,
      timeout: 20000,
    }
  );
}

/**
 * OPTIONS /api/agents/[agentId]/episodes/search
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
