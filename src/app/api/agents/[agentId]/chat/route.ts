/**
 * Agent Chat API Route
 *
 * POST /api/agents/[agentId]/chat - Send chat message to agent (with access control)
 */
import { NextRequest } from "next/server";

import type { AgentInfo, BonfireListResponse, ChatRequest } from "@/types";

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
 * POST /api/agents/[agentId]/chat
 *
 * Send a chat message to an agent.
 * Validates bonfire access if bonfire_id is provided.
 *
 * Request Body:
 * - message: string (required)
 * - chat_history?: ChatMessage[]
 * - graph_mode?: "adaptive" | "static" | "dynamic" | "none"
 * - center_node_uuid?: string
 * - graph_id?: string
 * - bonfire_id?: string (access control applied)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { agentId } = await params;

  if (!agentId) {
    return createErrorResponse("Agent ID is required", 400);
  }

  const { data: body, error } =
    await parseJsonBody<Partial<ChatRequest>>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  // Validate required fields
  if (!body?.message) {
    return createErrorResponse("message is required", 400);
  }

  // Check bonfire access if bonfire_id is provided
  if (body.bonfire_id) {
    // Fetch bonfire to check is_public
    const bonfireResponse = await proxyToBackend<BonfireListResponse>(
      "/bonfires",
      {
        method: "GET",
      }
    );

    const bonfire = bonfireResponse.data?.bonfires?.find(
      (b) => b.id === body.bonfire_id
    );

    const access = await checkBonfireAccess(
      body.bonfire_id,
      bonfire?.is_public
    );
    if (!access.allowed) {
      const denied = createAccessDeniedResponse(access.reason);
      return createErrorResponse(
        denied.error,
        403,
        denied.details,
        denied.code
      );
    }
  } else {
    // No bonfire_id in body - check agent's bonfire
    const agentResponse = await proxyToBackend<AgentInfo>(
      `/agents/${agentId}`,
      {
        method: "GET",
      }
    );

    if (agentResponse.success && agentResponse.data?.bonfire_id) {
      const bonfireId = agentResponse.data.bonfire_id;

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
  }

  // Ensure agent_id is set in the body
  const chatRequest: ChatRequest = {
    ...body,
    message: body.message,
    agent_id: agentId,
  };

  return handleProxyRequest(`/agents/${agentId}/chat`, {
    method: "POST",
    body: chatRequest,
  });
}

/**
 * OPTIONS /api/agents/[agentId]/chat
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
