/**
 * Bonfires API Route
 *
 * GET /api/bonfires - List all bonfires
 */

import {
  handleProxyRequest,
  handleCorsOptions,
} from "@/lib/api/server-utils";

/**
 * GET /api/bonfires
 *
 * Fetches list of available bonfires from the backend.
 */
export async function GET() {
  return handleProxyRequest("/bonfires", {
    method: "GET",
  });
}

/**
 * OPTIONS /api/bonfires
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
