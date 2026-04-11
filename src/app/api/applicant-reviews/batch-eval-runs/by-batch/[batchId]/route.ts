import { NextRequest } from "next/server";

import { handleCorsOptions, handleProxyRequest } from "@/lib/api/server-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  const { batchId } = await params;
  return handleProxyRequest(
    `/applicant-reviews/batch-eval-runs/by-batch/${batchId}`,
    { method: "GET" },
  );
}

export function OPTIONS() {
  return handleCorsOptions();
}
