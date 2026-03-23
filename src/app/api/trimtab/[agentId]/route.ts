/**
 * Trimtab API Route — proxies to Delve backend
 *
 * GET /api/trimtab/:agentId              → GET /trimtabs/:agentId
 * GET /api/trimtab/:agentId?since=<ISO>  → GET /trimtabs/:agentId?since=<ISO>
 */
import { NextRequest } from "next/server";

import {
  extractQueryParams,
  handleProxyRequest,
} from "@/lib/api/server-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const { since } = extractQueryParams(request, ["since"]);

  return handleProxyRequest(`/trimtabs/${agentId}`, {
    method: "GET",
    queryParams: since ? { since } : undefined,
    includeAuth: false,
  });
}
