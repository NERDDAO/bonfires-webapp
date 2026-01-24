/**
 * Documents API Route
 *
 * GET /api/documents - List documents/chunks for a bonfire
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  extractQueryParams,
} from "@/lib/api/server-utils";

/**
 * GET /api/documents
 *
 * List labeled chunks/documents for a bonfire.
 *
 * Query Parameters:
 * - bonfire_id: string (required) - Bonfire to get documents for
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
