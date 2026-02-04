/**
 * HyperBlog View API Route
 *
 * GET /api/hyperblogs/[hyperblogId]/view - Get full content for a hyperblog
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ hyperblogId: string }>;
}

/**
 * GET /api/hyperblogs/[hyperblogId]/view
 *
 * Get full content (HTML or markdown) for a specific hyperblog.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { hyperblogId } = await params;

  if (!hyperblogId) {
    return createErrorResponse("HyperBlog ID is required", 400);
  }

  return handleProxyRequest(`/datarooms/hyperblogs/${hyperblogId}/view`, {
    method: "GET",
  });
}

/**
 * OPTIONS /api/hyperblogs/[hyperblogId]/view
 */
export function OPTIONS() {
  return handleCorsOptions();
}
