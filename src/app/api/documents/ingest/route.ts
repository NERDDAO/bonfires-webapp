/**
 * Document Ingest API Route
 *
 * POST /api/documents/ingest - Ingest a new document
 */

import { NextRequest } from "next/server";
import {
  handleProxyRequest,
  handleCorsOptions,
  createErrorResponse,
  parseJsonBody,
} from "@/lib/api/server-utils";
import type { DocumentIngestRequest } from "@/types";

/**
 * POST /api/documents/ingest
 *
 * Ingest a new document into the knowledge graph.
 *
 * Request Body:
 * - content: string (required) - Document content
 * - bonfire_id: string (required) - Target bonfire
 * - filename?: string - Original filename
 * - metadata?: object - Additional metadata
 */
export async function POST(request: NextRequest) {
  const { data: body, error } = await parseJsonBody<Partial<DocumentIngestRequest>>(request);

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

  const ingestRequest = {
    content: body.content,
    bonfire_id: body.bonfire_id,
    filename: body.filename,
    metadata: body.metadata,
  };

  return handleProxyRequest("/ingest_content", {
    method: "POST",
    body: ingestRequest,
  }, 201);
}

/**
 * OPTIONS /api/documents/ingest
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
