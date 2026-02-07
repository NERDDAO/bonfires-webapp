/**
 * DataRooms API Route
 *
 * GET /api/datarooms - List datarooms from marketplace
 * POST /api/datarooms - Create a new dataroom listing
 */
import { NextRequest } from "next/server";

import type { CreateDataRoomRequest } from "@/types";

import {
  createErrorResponse,
  extractQueryParams,
  handleCorsOptions,
  handleProxyRequest,
  parseJsonBody,
} from "@/lib/api/server-utils";

/**
 * GET /api/datarooms
 *
 * List datarooms from the marketplace.
 *
 * Query Parameters:
 * - limit?: number - Maximum results (default: 50, max: 100)
 * - offset?: number - Pagination offset (default: 0)
 * - include_inactive?: boolean - Include inactive datarooms
 * - bonfire_id?: string - Filter by bonfire
 * - creator_wallet?: string - Filter by creator wallet address
 */
export async function GET(request: NextRequest) {
  const params = extractQueryParams(request, [
    "limit",
    "offset",
    "include_inactive",
    "bonfire_id",
    "creator_wallet",
  ]);

  const limit = Math.min(parseInt(params["limit"] ?? "50", 10), 100);
  const offset = Math.max(parseInt(params["offset"] ?? "0", 10), 0);

  // Validate parameters
  if (limit < 1) {
    return createErrorResponse("limit must be at least 1", 400);
  }

  const queryParams: Record<string, string | number | boolean | undefined> = {
    limit,
    offset,
    include_inactive: params["include_inactive"] === "true",
  };

  if (params["bonfire_id"]) {
    queryParams["bonfire_id"] = params["bonfire_id"];
  }
  if (params["creator_wallet"]) {
    queryParams["creator_wallet"] = params["creator_wallet"];
  }

  return handleProxyRequest("/datarooms", {
    method: "GET",
    queryParams,
  });
}

/**
 * POST /api/datarooms
 *
 * Create a new dataroom marketplace listing.
 *
 * Request Body:
 * - bonfire_id: string (required)
 * - description: string (required, 10-1000 chars)
 * - system_prompt: string (required, can be empty)
 * - price_usd: number (required, > 0)
 * - query_limit?: number (1-1000)
 * - expiration_days?: number (1-365)
 * - creator_wallet?: string
 * - center_node_uuid?: string
 * - dynamic_pricing_enabled?: boolean
 * - price_step_usd?: number
 * - price_decay_rate?: number
 * - image_model?: string
 */
export async function POST(request: NextRequest) {
  const { data: body, error } =
    await parseJsonBody<Partial<CreateDataRoomRequest>>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  // Validate required fields
  if (!body?.bonfire_id) {
    return createErrorResponse("bonfire_id is required", 400);
  }
  if (!body?.description) {
    return createErrorResponse("description is required", 400);
  }
  if (body.description.length < 10 || body.description.length > 1000) {
    return createErrorResponse(
      "description must be between 10 and 1000 characters",
      400
    );
  }
  if (body.system_prompt === undefined || body.system_prompt === null) {
    return createErrorResponse(
      "system_prompt is required (can be empty string)",
      400
    );
  }
  if (body.system_prompt.length > 2000) {
    return createErrorResponse(
      "system_prompt must be at most 2000 characters",
      400
    );
  }
  if (body.price_usd === undefined || body.price_usd === null) {
    return createErrorResponse("price_usd is required", 400);
  }
  if (body.price_usd <= 0) {
    return createErrorResponse("price_usd must be greater than 0", 400);
  }

  // Validate optional constraints
  if (
    body.query_limit !== undefined &&
    (body.query_limit < 1 || body.query_limit > 1000)
  ) {
    return createErrorResponse("query_limit must be between 1 and 1000", 400);
  }
  if (
    body.expiration_days !== undefined &&
    (body.expiration_days < 1 || body.expiration_days > 365)
  ) {
    return createErrorResponse(
      "expiration_days must be between 1 and 365",
      400
    );
  }

  return handleProxyRequest(
    "/datarooms",
    {
      method: "POST",
      body,
    },
    201
  );
}

/**
 * OPTIONS /api/datarooms
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
