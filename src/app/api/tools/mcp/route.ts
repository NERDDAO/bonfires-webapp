/**
 * MCP Tools API Route
 *
 * GET /api/tools/mcp - List available MCP tools
 */
import { handleCorsOptions, handleProxyRequest } from "@/lib/api/server-utils";

export async function GET() {
  return handleProxyRequest("/tools/mcp");
}

export function OPTIONS() {
  return handleCorsOptions();
}
