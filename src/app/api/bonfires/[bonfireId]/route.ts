/**
 * Single Bonfire API Route
 *
 * GET /api/bonfires/[bonfireId] - Get bonfire details
 */

import { NextRequest } from "next/server";
import {
  proxyToBackend,
  handleCorsOptions,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/server-utils";
import type { BonfireListResponse } from "@/types";

interface RouteParams {
  params: Promise<{ bonfireId: string }>;
}

/**
 * GET /api/bonfires/[bonfireId]
 *
 * Get details of a specific bonfire including taxonomy stats.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { bonfireId } = await params;

  if (!bonfireId) {
    return createErrorResponse("Bonfire ID is required", 400);
  }

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

  const bonfire = response.data?.bonfires?.find((item) => item.id === bonfireId);
  if (!bonfire) {
    return createErrorResponse("Bonfire not found", 404);
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
