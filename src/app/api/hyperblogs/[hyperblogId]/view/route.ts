/**
 * HyperBlog View API Route
 *
 * GET /api/hyperblogs/[hyperblogId]/view - Get full content for a hyperblog
 * POST /api/hyperblogs/[hyperblogId]/view - Record a page view (deduplicated per user/session in 1h)
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
  parseJsonBody,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ hyperblogId: string }>;
}

/** Request body for recording a view (user_wallet and/or session_id, both optional) */
interface HyperBlogViewRequest {
  user_wallet?: string;
  session_id?: string;
}

/**
 * GET /api/hyperblogs/[hyperblogId]/view
 *
 * Get full content (HTML or markdown) for a specific hyperblog.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { hyperblogId } = await params;

  if (!hyperblogId) {
    return createErrorResponse("HyperBlog ID is required", 400);
  }

  return handleProxyRequest(`/datarooms/hyperblogs/${hyperblogId}/view`, {
    method: "GET",
  });
}

/**
 * POST /api/hyperblogs/[hyperblogId]/view
 *
 * Record a page view. Views are deduplicated per user/session in a 1-hour window.
 * Send user_wallet and/or session_id (at least one recommended for deduplication).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { hyperblogId } = await params;

  if (!hyperblogId) {
    return createErrorResponse("HyperBlog ID is required", 400);
  }

  const { data: body, error } = await parseJsonBody<HyperBlogViewRequest>(
    request
  );
  if (error) {
    return createErrorResponse(error, 400);
  }

  const viewBody: HyperBlogViewRequest = {
    ...(body?.user_wallet != null && body.user_wallet !== ""
      ? { user_wallet: body.user_wallet }
      : {}),
    ...(body?.session_id != null && body.session_id !== ""
      ? { session_id: body.session_id }
      : {}),
  };

  return handleProxyRequest(
    `/datarooms/hyperblogs/${hyperblogId}/view`,
    {
      method: "POST",
      body: viewBody,
      includeAuth: false,
    }
  );
}

/**
 * OPTIONS /api/hyperblogs/[hyperblogId]/view
 */
export function OPTIONS() {
  return handleCorsOptions();
}
