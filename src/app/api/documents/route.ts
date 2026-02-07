/**
 * Documents API Route
 *
 * GET /api/documents - List documents/chunks for a bonfire (with access control)
 */
import { NextRequest } from "next/server";

import type { BonfireListResponse } from "@/types";

import {
  checkBonfireAccess,
  createAccessDeniedResponse,
} from "@/lib/api/bonfire-access";
import {
  createErrorResponse,
  extractQueryParams,
  handleCorsOptions,
  handleProxyRequest,
  proxyToBackend,
} from "@/lib/api/server-utils";

/**
 * GET /api/documents
 *
 * List labeled chunks/documents for a bonfire.
 * Validates bonfire access before returning documents.
 *
 * Query Parameters:
 * - bonfire_id: string (required) - Bonfire to get documents for (access control applied)
 * - page?: number - Page number (default: 1)
 * - page_size?: number - Page size (default: 20)
 * - group_by?: string - Group results by 'document' for document-level view
 * - preview_limit?: number - Preview chunks per document (documents view)
 * - label?: string - Filter by taxonomy label
 */
export async function GET(request: NextRequest) {
  const params = extractQueryParams(request, [
    "bonfire_id",
    "page",
    "page_size",
    "group_by",
    "preview_limit",
    "label",
  ]);

  if (!params["bonfire_id"]) {
    return createErrorResponse("bonfire_id is required", 400);
  }

  // Check bonfire access
  const bonfireResponse = await proxyToBackend<BonfireListResponse>(
    "/bonfires",
    {
      method: "GET",
    }
  );

  const bonfire = bonfireResponse.data?.bonfires?.find(
    (b) => b.id === params["bonfire_id"]
  );

  const access = await checkBonfireAccess(
    params["bonfire_id"],
    bonfire?.is_public
  );
  if (!access.allowed) {
    const denied = createAccessDeniedResponse(access.reason);
    return createErrorResponse(denied.error, 403, denied.details, denied.code);
  }

  const queryParams: Record<string, string | number | undefined> = {
    page: params["page"] ? parseInt(params["page"], 10) : 1,
    page_size: params["page_size"] ? parseInt(params["page_size"], 10) : 20,
  };

  if (params["group_by"]) {
    queryParams["group_by"] = params["group_by"];
  }
  if (params["preview_limit"]) {
    queryParams["preview_limit"] = parseInt(params["preview_limit"], 10);
  }
  if (params["label"]) {
    queryParams["label"] = params["label"];
  }

  return handleProxyRequest(`/bonfire/${params["bonfire_id"]}/labeled_chunks`, {
    method: "GET",
    queryParams,
  });
}

/**
 * OPTIONS /api/documents
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
