/**
 * Agent Config API Route
 *
 * POST /api/agent-config - Create a new agent on a bonfire
 *
 * Proxies to the Delve backend POST /agents with full agent-config schema
 * (deploymentConfiguration, agentFeatures, enabledMcpTools, etc.).
 * Automatically registers the agent to the specified bonfire.
 */
import { NextRequest } from "next/server";

import type { BonfireListResponse } from "@/types";
import type { AgentDeployRequest } from "@/types/agent-config";

import {
  checkBonfireAccess,
  createAccessDeniedResponse,
} from "@/lib/api/bonfire-access";
import {
  createErrorResponse,
  createSuccessResponse,
  handleCorsOptions,
  parseJsonBody,
  proxyToBackend,
} from "@/lib/api/server-utils";

export async function POST(request: NextRequest) {
  const { data: body, error } = await parseJsonBody<AgentDeployRequest>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  if (!body?.agentName || !body.agentUsername || !body.agentContext || !body.bonfireId) {
    return createErrorResponse(
      "agentName, agentUsername, agentContext, and bonfireId are required",
      400,
    );
  }

  const bonfireResponse = await proxyToBackend<BonfireListResponse>("/bonfires", {
    method: "GET",
  });
  const bonfire = bonfireResponse.data?.bonfires?.find((b) => b.id === body.bonfireId);
  const access = await checkBonfireAccess(body.bonfireId, bonfire?.is_public);

  if (!access.allowed) {
    const denied = createAccessDeniedResponse(access.reason);
    return createErrorResponse(denied.error, 403, denied.details, denied.code);
  }

  const backendBody = {
    username: body.agentUsername,
    name: body.agentName,
    context: body.agentContext,
    bonfireId: body.bonfireId,
    isActive: body.isActive ?? false,
    timezone: body.timezone,
    deploymentConfiguration: {
      platform: body.platform ?? "telegram",
      bonfireId: body.bonfireId,
      ...(body.telegramBotToken ? { telegramBotToken: body.telegramBotToken } : {}),
      ...(body.discordBotToken ? { discordBotToken: body.discordBotToken } : {}),
      ...(body.reportingConfig ? { reportingConfig: body.reportingConfig } : {}),
    },
    ...(body.agentFeatures ? { agentFeatures: body.agentFeatures } : {}),
    ...(body.chatConfig ? { chatConfig: body.chatConfig } : {}),
    ...(body.enabledMcpTools ? { enabledMcpTools: body.enabledMcpTools } : {}),
    ...(body.agentEnvVars ? { agentEnvVars: body.agentEnvVars } : {}),
  };

  const result = await proxyToBackend("/agents", {
    method: "POST",
    body: backendBody,
  });

  if (!result.success) {
    return createErrorResponse(
      result.error?.error ?? "Failed to create agent",
      result.status,
      result.error?.details,
    );
  }

  return createSuccessResponse(result.data, 201);
}

export function OPTIONS() {
  return handleCorsOptions();
}
