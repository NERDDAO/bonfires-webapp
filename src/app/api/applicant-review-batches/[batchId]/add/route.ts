import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> },
) {
  const { batchId } = await context.params;
  const body = await request.json();

  if (!body?.rows) {
    return createErrorResponse("rows is required", 400);
  }

  return handleProxyRequest(`/applicant-review-batches/${batchId}/add`, {
    method: "POST",
    body,
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
