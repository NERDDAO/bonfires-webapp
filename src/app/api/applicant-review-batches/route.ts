import { NextRequest } from "next/server";

import {
  extractQueryParams,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

export async function GET(request: NextRequest) {
  const params = extractQueryParams(request, ["bonfire_id"]);

  return handleProxyRequest("/applicant-review-batches", {
    method: "GET",
    queryParams: params,
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
