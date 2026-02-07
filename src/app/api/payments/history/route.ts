/**
 * Payment History API Route
 *
 * GET /api/payments/history - Fetch payment history for a wallet address
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  extractQueryParams,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

/**
 * GET /api/payments/history
 *
 * Fetch payment history for a specific wallet address.
 *
 * Query Parameters:
 * - user_wallet: string (required) - Wallet address to fetch history for
 * - limit: number (optional) - Maximum number of results (default: 20)
 * - offset: number (optional) - Offset for pagination (default: 0)
 * - type: string (optional) - Filter by payment type (chat, delve, dataroom, hyperblog)
 */
export async function GET(request: NextRequest) {
  const params = extractQueryParams(request, [
    "user_wallet",
    "limit",
    "offset",
    "type",
  ]);

  if (!params["user_wallet"]) {
    return createErrorResponse("user_wallet is required", 400);
  }

  // Build query params for backend
  const queryParams: Record<string, string | number | undefined> = {
    user_wallet: params["user_wallet"],
    limit: params["limit"] ? parseInt(params["limit"], 10) : 20,
    offset: params["offset"] ? parseInt(params["offset"], 10) : 0,
  };

  if (params["type"]) {
    queryParams["type"] = params["type"];
  }

  return handleProxyRequest("/payments/history", {
    method: "GET",
    queryParams,
  });
}

/**
 * OPTIONS /api/payments/history
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
