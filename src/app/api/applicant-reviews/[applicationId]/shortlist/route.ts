import { NextRequest } from "next/server";

import { handleCorsOptions, handleProxyRequest } from "@/lib/api/server-utils";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await context.params;
  const body = await request.json();
  return handleProxyRequest(`/applicant-reviews/${applicationId}/shortlist`, {
    method: "POST",
    body,
  });
}

export function OPTIONS() {
  return handleCorsOptions();
}
