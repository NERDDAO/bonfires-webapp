/**
 * Payment Status API Route
 *
 * GET /api/payments/status - Check payment/subscription status
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  extractQueryParams,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

/**
 * GET /api/payments/status
 *
 * Check the status of a payment or subscription.
 *
 * Query Parameters:
 * - tx_hash: string (required) - Transaction hash to check
 */
export async function GET(request: NextRequest) {
  const params = extractQueryParams(request, ["tx_hash"]);

  if (!params["tx_hash"]) {
    return createErrorResponse("tx_hash is required", 400);
  }

  // Check microsub/subscription status by tx_hash
  return handleProxyRequest(`/microsubs/${params["tx_hash"]}/htn`, {
    method: "GET",
  });
}

/**
 * OPTIONS /api/payments/status
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
