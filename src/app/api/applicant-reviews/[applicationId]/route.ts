import { NextRequest } from "next/server";

import { handleCorsOptions, handleProxyRequest } from "@/lib/api/server-utils";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await context.params;
  return handleProxyRequest(`/applicant-reviews/${applicationId}`, {
    method: "GET",
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
