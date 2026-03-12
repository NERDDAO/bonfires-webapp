import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body?.bonfire_id) {
    return createErrorResponse("bonfire_id is required", 400);
  }

  return handleProxyRequest("/applicant-review-batches/import", {
    method: "POST",
    body,
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
