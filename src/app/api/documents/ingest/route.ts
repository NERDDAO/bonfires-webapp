/**
 * Document Ingest API Route
 *
 * POST /api/documents/ingest - Ingest a new document (with access control)
 */
import { NextRequest } from "next/server";

import type { BonfireListResponse, DocumentIngestRequest } from "@/types";

import {
  checkBonfireAccess,
  createAccessDeniedResponse,
} from "@/lib/api/bonfire-access";
import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
  parseJsonBody,
  proxyToBackend,
} from "@/lib/api/server-utils";

/**
 * POST /api/documents/ingest
 *
 * Ingest a new document into the knowledge graph.
 * Validates bonfire access before allowing ingestion.
 *
 * Request Body:
 * - content: string (required) - Document content
 * - bonfire_id: string (required) - Target bonfire (access control applied)
 * - filename?: string - Original filename
 * - metadata?: object - Additional metadata
 */
export async function POST(request: NextRequest) {
  const { data: body, error } =
    await parseJsonBody<Partial<DocumentIngestRequest>>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  // Validate required fields
  if (!body?.content) {
    return createErrorResponse("content is required", 400);
  }
  if (!body?.bonfire_id) {
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
    (b) => b.id === body.bonfire_id
  );

  const access = await checkBonfireAccess(body.bonfire_id, bonfire?.is_public);
  if (!access.allowed) {
    const denied = createAccessDeniedResponse(access.reason);
    return createErrorResponse(denied.error, 403, denied.details, denied.code);
  }

  const ingestRequest = {
    content: body.content,
    bonfire_id: body.bonfire_id,
    filename: body.filename,
    metadata: body.metadata,
  };

  return handleProxyRequest(
    "/ingest_content",
    {
      method: "POST",
      body: ingestRequest,
    },
    201
  );
}

/**
 * OPTIONS /api/documents/ingest
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
