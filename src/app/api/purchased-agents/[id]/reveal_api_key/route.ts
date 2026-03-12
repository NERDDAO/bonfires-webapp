/**
 * Purchased Agent Reveal API Key Route
 *
 * POST /api/purchased-agents/[id]/reveal_api_key - Reveal API key with signature
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return createErrorResponse("Purchase ID is required", 400);
  }
  const body = await request.json();
  return handleProxyRequest(`/purchased-agents/${id}/reveal_api_key`, {
    method: "POST",
    body,
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
