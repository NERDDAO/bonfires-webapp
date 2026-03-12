import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxySSERequest,
} from "@/lib/api/server-utils";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.application_ids || !Array.isArray(body.application_ids)) {
    return createErrorResponse("application_ids array is required", 400);
  }

  return handleProxySSERequest("/applicant-reviews/batch-evaluate-stream", {
    method: "POST",
    body: {
      application_ids: body.application_ids,
      batch_id: body.batch_id ?? null,
      resume_from_seq: body.resume_from_seq ?? null,
    },
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
