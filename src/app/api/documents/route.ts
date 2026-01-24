/**
 * Documents API Route
 *
 * GET /api/documents - List documents/chunks for a bonfire
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  extractQueryParams,
} from "@/lib/api/server-utils";

/**
 * GET /api/documents
 *
 * List labeled chunks/documents for a bonfire.
 *
 * Query Parameters:
 * - bonfire_id: string (required) - Bonfire to get documents for
 * - limit?: number - Maximum results (default: 50)
 * - offset?: number - Pagination offset (default: 0)
 * - label?: string - Filter by taxonomy label
 */
export async function GET(request: NextRequest) {
  const params = extractQueryParams(request, [
    "bonfire_id",
    "limit",
    "offset",
    "label",
  ]);

  if (!params["bonfire_id"]) {
    return createErrorResponse("bonfire_id is required", 400);
  }

  const queryParams: Record<string, string | number | undefined> = {
    limit: params["limit"] ? parseInt(params["limit"], 10) : 50,
    offset: params["offset"] ? parseInt(params["offset"], 10) : 0,
  };

  if (params["label"]) {
    queryParams["label"] = params["label"];
  }

  return handleProxyRequest(`/bonfire/${params["bonfire_id"]}/labeled_chunks`, {
    method: "GET",
    queryParams,
  });
}

/**
 * OPTIONS /api/documents
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
