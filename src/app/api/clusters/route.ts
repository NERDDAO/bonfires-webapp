/**
 * Clusters API Route
 *
 * GET /api/clusters?owner_bonfire_id=X - List clusters owned by a bonfire
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  extractQueryParams,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

export async function GET(request: NextRequest) {
  const params = extractQueryParams(request, ["owner_bonfire_id"]);

  if (!params["owner_bonfire_id"]) {
    return createErrorResponse("owner_bonfire_id is required", 400);
  }

  return handleProxyRequest("/clusters", {
    method: "GET",
    queryParams: { owner_bonfire_id: params["owner_bonfire_id"] },
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
