/**
 * Single DataRoom API Route
 *
 * GET /api/datarooms/[dataroomId] - Get dataroom details
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ dataroomId: string }>;
}

/**
 * GET /api/datarooms/[dataroomId]
 *
 * Get details of a specific dataroom.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { dataroomId } = await params;

  if (!dataroomId) {
    return createErrorResponse("DataRoom ID is required", 400);
  }

  return handleProxyRequest(`/datarooms/${dataroomId}`, {
    method: "GET",
  });
}

/**
 * OPTIONS /api/datarooms/[dataroomId]
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
