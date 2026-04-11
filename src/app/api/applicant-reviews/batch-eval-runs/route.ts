import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.application_ids || !Array.isArray(body.application_ids)) {
    return createErrorResponse("application_ids array is required", 400);
  }

  const proxyBody: Record<string, unknown> = {
    application_ids: body.application_ids,
    rubric_id: body.rubric_id ?? null,
    force: body.force ?? false,
    batch_id: body.batch_id ?? null,
  };
  if (body.rescore_only) {
    proxyBody.rescore_only = true;
    proxyBody.review_bonfire_id = body.review_bonfire_id;
  }

  return handleProxyRequest("/applicant-reviews/batch-eval-runs", {
    method: "POST",
    body: proxyBody,
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
