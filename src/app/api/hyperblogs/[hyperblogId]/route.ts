/**
 * Single HyperBlog API Route
 *
 * GET /api/hyperblogs/[hyperblogId] - Get hyperblog details
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ hyperblogId: string }>;
}

/**
 * GET /api/hyperblogs/[hyperblogId]
 *
 * Get details of a specific hyperblog.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { hyperblogId } = await params;

  if (!hyperblogId) {
    return createErrorResponse("HyperBlog ID is required", 400);
  }

  // The backend endpoint structure for getting a specific hyperblog
  // Note: HyperBlogs are accessed via their dataroom context
  return handleProxyRequest(`/datarooms/hyperblogs/${hyperblogId}`, {
    method: "GET",
  });
}

/**
 * OPTIONS /api/hyperblogs/[hyperblogId]
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
