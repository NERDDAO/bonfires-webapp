import { NextRequest } from "next/server";

import {
  extractQueryParams,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await context.params;
  const queryParams = extractQueryParams(request, ["rubric_id"]);
  return handleProxyRequest(`/applicant-reviews/${applicationId}`, {
    method: "GET",
    queryParams,
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await context.params;
  return handleProxyRequest(`/applicant-reviews/${applicationId}`, {
    method: "DELETE",
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
