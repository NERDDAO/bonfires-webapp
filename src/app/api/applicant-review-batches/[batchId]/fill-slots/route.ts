import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  const { batchId } = await params;
  const body = await request.json();

  if (!body?.total_slots || typeof body.total_slots !== "number") {
    return createErrorResponse("total_slots (number) is required", 400);
  }

  return handleProxyRequest(
    `/applicant-review-batches/${batchId}/fill-slots`,
    {
      method: "POST",
      body,
    },
  );
}

export function OPTIONS() {
  return handleCorsOptions();
}
