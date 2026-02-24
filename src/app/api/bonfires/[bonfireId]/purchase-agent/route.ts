/**
 * Purchase Agent API Route
 *
 * POST /api/bonfires/[bonfireId]/purchase-agent - Purchase an agent via x402
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

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { bonfireId } = await params;
  if (!bonfireId) {
    return createErrorResponse("Bonfire ID is required", 400);
  }
  const body = await request.json();
  return handleProxyRequest(`/bonfires/${bonfireId}/purchase-agent`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
