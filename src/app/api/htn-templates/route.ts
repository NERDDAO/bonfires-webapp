/**
 * HTN Templates API Route
 *
 * GET /api/htn-templates - List active HTN templates
 * POST /api/htn-templates - Create a new HTN template
 */
import { NextRequest } from "next/server";

import type { CreateHTNTemplateRequest } from "@/types";

import {
  createErrorResponse,
  extractQueryParams,
  handleCorsOptions,
  handleProxyRequest,
  parseJsonBody,
} from "@/lib/api/server-utils";

/**
 * GET /api/htn-templates
 *
 * List active HTN templates with optional type filter.
 *
 * Query Parameters:
 * - template_type?: string - Filter by template type (blog, card, curriculum)
 */
export async function GET(request: NextRequest) {
  const params = extractQueryParams(request, ["template_type"]);

  const queryParams: Record<string, string | number | boolean | undefined> = {};

  if (params["template_type"]) {
    queryParams["template_type"] = params["template_type"];
  }

  return handleProxyRequest("/htn-templates", {
    method: "GET",
    queryParams,
  });
}

/**
 * POST /api/htn-templates
 *
 * Create a new HTN template.
 *
 * Request Body:
 * - name: string (required, 1-200 chars)
 * - template_type: string (required, blog/card/curriculum)
 * - description?: string (max 1000 chars)
 * - system_prompt: string (required, min 10 chars)
 * - user_prompt_template: string (required, min 10 chars)
 * - node_count_config: object (required)
 * - default_length?: string (short/medium/long, default: medium)
 * - created_by?: string
 */
export async function POST(request: NextRequest) {
  const { data: body, error } =
    await parseJsonBody<Partial<CreateHTNTemplateRequest>>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  if (!body?.name) {
    return createErrorResponse("name is required", 400);
  }
  if (!body?.template_type) {
    return createErrorResponse("template_type is required", 400);
  }
  if (!body?.system_prompt) {
    return createErrorResponse("system_prompt is required", 400);
  }
  if (!body?.user_prompt_template) {
    return createErrorResponse("user_prompt_template is required", 400);
  }
  if (!body?.node_count_config) {
    return createErrorResponse("node_count_config is required", 400);
  }

  return handleProxyRequest(
    "/htn-templates",
    {
      method: "POST",
      body,
    },
    201
  );
}

/**
 * OPTIONS /api/htn-templates
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
