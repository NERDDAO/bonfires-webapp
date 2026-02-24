/**
 * Purchased Agent Reveal Nonce API Route
 *
 * GET /api/purchased-agents/[id]/reveal_nonce - Get nonce for API key reveal
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

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return createErrorResponse("Purchase ID is required", 400);
  }
  return handleProxyRequest(`/purchased-agents/${id}/reveal_nonce`, {
    method: "GET",
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
