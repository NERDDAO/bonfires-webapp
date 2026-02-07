/**
 * Single Bonfire API Route
 *
 * GET /api/bonfires/[bonfireId] - Get bonfire details (with access control)
 */
import { NextRequest } from "next/server";

import type { BonfireListResponse } from "@/types";

import {
  checkBonfireAccess,
  createAccessDeniedResponse,
} from "@/lib/api/bonfire-access";
import {
  createErrorResponse,
  createSuccessResponse,
  handleCorsOptions,
  proxyToBackend,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ bonfireId: string }>;
}

/**
 * GET /api/bonfires/[bonfireId]
 *
 * Get details of a specific bonfire including taxonomy stats.
 * Checks access control - private bonfires require org membership.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { bonfireId } = await params;

  if (!bonfireId) {
    return createErrorResponse("Bonfire ID is required", 400);
  }

  // Fetch bonfire to check if it exists and get is_public flag
  const response = await proxyToBackend<BonfireListResponse>("/bonfires", {
    method: "GET",
  });

  if (!response.success) {
    return createErrorResponse(
      response.error?.error ?? "Failed to load bonfire",
      response.status,
      response.error?.details,
      response.error?.code
    );
  }

  const bonfire = response.data?.bonfires?.find(
    (item) => item.id === bonfireId
  );
  if (!bonfire) {
    return createErrorResponse("Bonfire not found", 404);
  }

  // Check access control
  const access = await checkBonfireAccess(bonfireId, bonfire.is_public);
  if (!access.allowed) {
    const denied = createAccessDeniedResponse(access.reason);
    return createErrorResponse(denied.error, 403, denied.details, denied.code);
  }

  return createSuccessResponse(bonfire);
}

/**
 * OPTIONS /api/bonfires/[bonfireId]
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
