import { NextRequest } from "next/server";

import {
  extractQueryParams,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ rubricId: string }> },
) {
  const { rubricId } = await context.params;
  const queryParams = extractQueryParams(request, ["bonfire_id"]);

  return handleProxyRequest(`/applicant-review-rubrics/${rubricId}`, {
    method: "GET",
    queryParams,
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
