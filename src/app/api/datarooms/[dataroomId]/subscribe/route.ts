/**
 * DataRoom Subscribe API Route
 *
 * POST /api/datarooms/[dataroomId]/subscribe - Subscribe to a dataroom
 */
import { NextRequest } from "next/server";

import type { DataRoomSubscribeRequest } from "@/types";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
  parseJsonBody,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ dataroomId: string }>;
}

/**
 * POST /api/datarooms/[dataroomId]/subscribe
 *
 * Subscribe to a dataroom (requires payment).
 *
 * Request Body:
 * - payment_header: string (required) - x402 payment header
 * - user_wallet: string (required) - Subscriber's wallet address
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { dataroomId } = await params;

  if (!dataroomId) {
    return createErrorResponse("DataRoom ID is required", 400);
  }

  const { data: body, error } =
    await parseJsonBody<Partial<DataRoomSubscribeRequest>>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  // Validate required fields
  if (!body?.payment_header) {
    return createErrorResponse("payment_header is required", 400);
  }
  if (!body?.user_wallet) {
    return createErrorResponse("user_wallet is required", 400);
  }

  // The backend endpoint for subscribing
  return handleProxyRequest(
    `/datarooms/${dataroomId}/subscribe`,
    {
      method: "POST",
      body,
      headers: {
        "X-Payment-Header": body.payment_header,
      },
    },
    201
  );
}

/**
 * OPTIONS /api/datarooms/[dataroomId]/subscribe
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
