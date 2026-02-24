/**
 * Bonfire Pricing API Route
 *
 * GET  /api/bonfires/[bonfireId]/pricing - Get pricing config
 * PUT  /api/bonfires/[bonfireId]/pricing - Update pricing config (owner only)
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ bonfireId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { bonfireId } = await params;
  if (!bonfireId) {
    return createErrorResponse("Bonfire ID is required", 400);
  }
  return handleProxyRequest(`/bonfires/${bonfireId}/pricing`, { method: "GET" });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { bonfireId } = await params;
  if (!bonfireId) {
    return createErrorResponse("Bonfire ID is required", 400);
  }
  const body = await request.json();
  return handleProxyRequest(`/bonfires/${bonfireId}/pricing`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
