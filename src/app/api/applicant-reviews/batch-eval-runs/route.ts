import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

interface BatchEvalRunBody {
  application_ids?: string[] | null;
  rubric_id?: string | null;
  force?: boolean;
  batch_id?: string | null;
  rescore_only?: boolean;
  review_bonfire_id?: string | null;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.batch_id && (!body?.application_ids || !Array.isArray(body.application_ids))) {
    return createErrorResponse("batch_id or application_ids array is required", 400);
  }

  const proxyBody: BatchEvalRunBody = {
    batch_id: body.batch_id ?? null,
    rubric_id: body.rubric_id ?? null,
    force: body.force ?? false,
  };
  if (body.application_ids) {
    proxyBody.application_ids = body.application_ids;
  }
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
