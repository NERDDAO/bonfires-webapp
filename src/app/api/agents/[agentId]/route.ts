/**
 * Single Agent API Route
 *
 * GET /api/agents/[agentId] - Get agent details (with access control)
 * PUT /api/agents/[agentId] - Update agent (with access control)
 */
import { NextRequest } from "next/server";

import type { AgentInfo, BonfireListResponse } from "@/types";

import {
  checkBonfireAccess,
  createAccessDeniedResponse,
} from "@/lib/api/bonfire-access";
import {
  createErrorResponse,
  createSuccessResponse,
  handleCorsOptions,
  handleProxyRequest,
  parseJsonBody,
  proxyToBackend,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ agentId: string }>;
}

/**
 * Helper to check if user can access an agent based on its bonfire
 */
async function checkAgentAccess(agentId: string) {
  // Fetch the agent to get its bonfire_id
  const agentResponse = await proxyToBackend<AgentInfo>(`/agents/${agentId}`, {
    method: "GET",
  });

  if (!agentResponse.success || !agentResponse.data) {
    return { allowed: false, error: "Agent not found", status: 404 };
  }

  const agent = agentResponse.data;
  const bonfireId = agent.bonfire_id;

  if (!bonfireId) {
    // Agent has no bonfire, allow access
    return { allowed: true, agent };
  }

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
    return {
      allowed: false,
      error: "Access denied",
      status: 403,
      reason: access.reason,
    };
  }

  return { allowed: true, agent };
}

/**
 * GET /api/agents/[agentId]
 *
 * Get details of a specific agent.
 * Checks access based on the agent's bonfire.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { agentId } = await params;

  if (!agentId) {
    return createErrorResponse("Agent ID is required", 400);
  }

  const accessCheck = await checkAgentAccess(agentId);
  if (!accessCheck.allowed) {
    if (accessCheck.status === 404) {
      return createErrorResponse(accessCheck.error ?? "Agent not found", 404);
    }
    const denied = createAccessDeniedResponse(accessCheck.reason);
    return createErrorResponse(denied.error, 403, denied.details, denied.code);
  }

  return createSuccessResponse(accessCheck.agent);
}

/**
 * PUT /api/agents/[agentId]
 *
 * Update an existing agent.
 * Checks access based on the agent's bonfire.
 *
 * Request Body:
 * - name?: string
 * - is_active?: boolean
 * - capabilities?: string[]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { agentId } = await params;

  if (!agentId) {
    return createErrorResponse("Agent ID is required", 400);
  }

  // Check access before allowing update
  const accessCheck = await checkAgentAccess(agentId);
  if (!accessCheck.allowed) {
    if (accessCheck.status === 404) {
      return createErrorResponse(accessCheck.error ?? "Agent not found", 404);
    }
    const denied = createAccessDeniedResponse(accessCheck.reason);
    return createErrorResponse(denied.error, 403, denied.details, denied.code);
  }

  const { data: body, error } = await parseJsonBody(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  return handleProxyRequest(`/agents/${agentId}`, {
    method: "PUT",
    body,
  });
}

/**
 * OPTIONS /api/agents/[agentId]
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
