/**
 * HTN Template Detail API Route
 *
 * GET /api/htn-templates/[templateId] - Get a single HTN template by ID
 */
import { NextRequest } from "next/server";

import {
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

/**
 * GET /api/htn-templates/[templateId]
 *
 * Fetch a single HTN template including required_inputs.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;

  return handleProxyRequest(`/htn-templates/${templateId}`, {
    method: "GET",
  });
}

/**
 * OPTIONS /api/htn-templates/[templateId]
 */
export function OPTIONS() {
  return handleCorsOptions();
}
