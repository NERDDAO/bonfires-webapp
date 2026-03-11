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

  const paymentHeader = body.payment_header;
  if (!paymentHeader) {
    return createErrorResponse("payment_header is required", 400);
  }

  return handleProxyRequest("/paid/applicant-reviews/self", {
    method: "POST",
    body: { bonfire_id: body.bonfire_id },
    headers: { "X-Payment-Header": paymentHeader },
    includeAuth: true,
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
