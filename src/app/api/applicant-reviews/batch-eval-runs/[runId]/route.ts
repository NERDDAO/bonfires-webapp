import { NextRequest } from "next/server";

import { handleCorsOptions, handleProxyRequest } from "@/lib/api/server-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  return handleProxyRequest(
    `/applicant-reviews/batch-eval-runs/${runId}`
  );
}

export function OPTIONS() {
  return handleCorsOptions();
}
