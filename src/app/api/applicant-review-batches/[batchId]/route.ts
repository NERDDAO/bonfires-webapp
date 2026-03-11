import { NextRequest } from "next/server";

import { handleCorsOptions, handleProxyRequest } from "@/lib/api/server-utils";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ batchId: string }> },
) {
  const { batchId } = await context.params;
  return handleProxyRequest(`/applicant-review-batches/${batchId}`, {
    method: "GET",
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
