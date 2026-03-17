import { NextRequest } from "next/server";

import { handleCorsOptions, handleProxySSERequest } from "@/lib/api/server-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const resumeFromSeq = searchParams.get("resume_from_seq");

  const queryString = resumeFromSeq
    ? `?resume_from_seq=${resumeFromSeq}`
    : "";

  return handleProxySSERequest(
    `/applicant-reviews/batch-eval-runs/${runId}/stream${queryString}`
  );
}

export function OPTIONS() {
  return handleCorsOptions();
}
