/**
 * Agent Chat API Route
 *
 * POST /api/agents/[agentId]/chat - Send chat message to agent
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  parseJsonBody,
} from "@/lib/api/server-utils";
import type { ChatRequest } from "@/types";

interface RouteParams {
  params: Promise<{ agentId: string }>;
}

/**
 * POST /api/agents/[agentId]/chat
 *
 * Send a chat message to an agent.
 *
 * Request Body:
 * - message: string (required)
 * - chat_history?: ChatMessage[]
 * - graph_mode?: "adaptive" | "static" | "dynamic" | "none"
 * - center_node_uuid?: string
 * - graph_id?: string
 * - bonfire_id?: string
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { agentId } = await params;

  if (!agentId) {
    return createErrorResponse("Agent ID is required", 400);
  }

  const { data: body, error } = await parseJsonBody<Partial<ChatRequest>>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  // Validate required fields
  if (!body?.message) {
    return createErrorResponse("message is required", 400);
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
