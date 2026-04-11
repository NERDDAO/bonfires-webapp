import { NextRequest } from "next/server";

import {
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bonfireId = searchParams.get("bonfire_id");
  if (!bonfireId) {
    return new Response(JSON.stringify({ error: "bonfire_id is required" }), { status: 400 });
  }

  const limit = searchParams.get("limit") ?? "500";
  return handleProxyRequest(
    `/knowledge_graph/bonfire-graph?bonfire_id=${bonfireId}&limit=${limit}`,
    { method: "GET" },
  );
}

export function OPTIONS() {
  return handleCorsOptions();
}
