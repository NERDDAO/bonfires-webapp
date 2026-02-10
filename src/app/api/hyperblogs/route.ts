/**
 * HyperBlogs API Route
 *
 * GET /api/hyperblogs - List public hyperblogs
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  extractQueryParams,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

/**
 * GET /api/hyperblogs
 *
 * List public hyperblogs across all datarooms.
 *
 * Query Parameters:
 * - limit?: number - Maximum results (default: 10, max: 100)
 * - offset?: number - Pagination offset (default: 0)
 * - dataroom_id?: string - Filter by specific dataroom
 * - bonfire_id?: string - Filter by bonfire (returns hyperblogs from all datarooms belonging to the bonfire)
 * - status?: string - Filter by status: "generating" | "completed" | "failed"
 * - generation_mode?: string - Filter by mode: "blog" | "card"
 */
export async function GET(request: NextRequest) {
  const params = extractQueryParams(request, [
    "limit",
    "offset",
    "dataroom_id",
    "bonfire_id",
    "status",
    "generation_mode",
  ]);

  // Parse and validate limit
  let limit = 10;
  if (params["limit"] !== undefined) {
    const parsedLimit = parseInt(params["limit"], 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return createErrorResponse("limit must be between 1 and 100", 400);
    }
    limit = parsedLimit;
  }

  // Parse and validate offset
  let offset = 0;
  if (params["offset"] !== undefined) {
    const parsedOffset = parseInt(params["offset"], 10);
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return createErrorResponse("offset must be 0 or greater", 400);
    }
    offset = parsedOffset;
  }

  // Validate status
  const validStatuses = ["generating", "completed", "failed"];
  if (params["status"] && !validStatuses.includes(params["status"])) {
    return createErrorResponse(
      `status must be one of: ${validStatuses.join(", ")}`,
      400
    );
  }

  // Validate generation_mode
  const validModes = ["blog", "card"];
  if (
    params["generation_mode"] &&
    !validModes.includes(params["generation_mode"])
  ) {
    return createErrorResponse(
      `generation_mode must be one of: ${validModes.join(", ")}`,
      400
    );
  }

  const queryParams: Record<string, string | number | boolean | undefined> = {
    limit,
    offset,
    is_public: true,
  };

  if (params["dataroom_id"]) {
    queryParams["dataroom_id"] = params["dataroom_id"];
  }
  if (params["bonfire_id"]) {
    queryParams["bonfire_id"] = params["bonfire_id"];
  }
  if (params["status"]) {
    queryParams["status"] = params["status"];
  }
  if (params["generation_mode"]) {
    queryParams["generation_mode"] = params["generation_mode"];
  }

  return handleProxyRequest("/datarooms/hyperblogs", {
    method: "GET",
    queryParams,
  });
}

/**
 * OPTIONS /api/hyperblogs
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
