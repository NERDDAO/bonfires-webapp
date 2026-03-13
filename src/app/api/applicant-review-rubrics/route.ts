import { NextRequest } from "next/server";

import {
  createErrorResponse,
  extractQueryParams,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

export async function GET(request: NextRequest) {
  const params = extractQueryParams(request, ["bonfire_id"]);

  if (!params["bonfire_id"]) {
    return createErrorResponse("bonfire_id is required", 400);
  }

  return handleProxyRequest("/applicant-review-rubrics", {
    method: "GET",
    queryParams: params,
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
