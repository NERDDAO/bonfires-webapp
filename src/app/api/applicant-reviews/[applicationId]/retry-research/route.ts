import { NextRequest } from "next/server";

import { handleCorsOptions, handleProxyRequest } from "@/lib/api/server-utils";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await context.params;
  return handleProxyRequest(
    `/applicant-reviews/${applicationId}/retry-research`,
    {
      method: "POST",
    },
  );
}

export function OPTIONS() {
  return handleCorsOptions();
}
