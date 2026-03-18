/**
 * Skills Catalog API Route
 *
 * GET /api/tools/skills - List available agent skills
 */
import { handleCorsOptions, handleProxyRequest } from "@/lib/api/server-utils";

export async function GET() {
  return handleProxyRequest("/tools/skills");
}

export function OPTIONS() {
  return handleCorsOptions();
}
