/**
 * Bonfires API Route
 *
 * GET /api/bonfires - List all bonfires (filtered by access)
 */
import type { BonfireListResponse } from "@/types";

import { filterAccessibleBonfires } from "@/lib/api/bonfire-access";
import {
  createErrorResponse,
  createSuccessResponse,
  handleCorsOptions,
  proxyToBackend,
} from "@/lib/api/server-utils";

/**
 * GET /api/bonfires
 *
 * Fetches list of available bonfires from the backend.
 * Filters to only return bonfires the user has access to:
 * - Public bonfires (is_public: true) are visible to everyone
 * - Private bonfires are only visible if user's org is linked to them
 */
export async function GET() {
  // Fetch all bonfires from backend
  const result = await proxyToBackend<BonfireListResponse>("/bonfires", {
    method: "GET",
  });

  if (!result.success || !result.data) {
    return createErrorResponse(
      result.error?.error ?? "Failed to fetch bonfires",
      result.status,
      result.error?.details
    );
  }

  // Filter to only accessible bonfires
  const accessibleBonfires = await filterAccessibleBonfires(
    result.data.bonfires ?? []
  );

  return createSuccessResponse({
    bonfires: accessibleBonfires,
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
