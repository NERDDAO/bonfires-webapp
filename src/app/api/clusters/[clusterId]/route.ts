import type { NextRequest } from "next/server";
import { handleProxyRequest } from "@/lib/api/server-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clusterId: string }> },
) {
  const { clusterId } = await params;
  return handleProxyRequest(`/clusters/${clusterId}`, {
    method: "GET",
    includeAuth: true,
  });
}
