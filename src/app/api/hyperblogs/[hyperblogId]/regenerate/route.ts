/**
 * HyperBlog Regenerate API Route
 *
 * POST /api/hyperblogs/[hyperblogId]/regenerate - Retry generation for a failed blog
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
 * POST /api/hyperblogs/[hyperblogId]/regenerate
 *
 * Re-enqueues generation for a failed hyperblog. No additional payment required.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { hyperblogId } = await params;

  if (!hyperblogId) {
    return createErrorResponse("HyperBlog ID is required", 400);
  }

  return handleProxyRequest(
    `/datarooms/hyperblogs/${hyperblogId}/regenerate`,
    {
      method: "POST",
      includeAuth: false,
    }
  );
}

/**
 * OPTIONS /api/hyperblogs/[hyperblogId]/regenerate
 */
export function OPTIONS() {
  return handleCorsOptions();
}
