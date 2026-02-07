/**
 * HyperBlog Purchase API Route
 *
 * POST /api/hyperblogs/purchase - Purchase / create a hyperblog for a dataroom
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
  parseJsonBody,
} from "@/lib/api/server-utils";

interface PurchaseBody {
  payment_header: unknown;
  dataroom_id: string;
  user_query: string;
  is_public?: boolean;
  blog_length?: string;
  generation_mode?: string;
  expected_amount?: string;
}

/**
 * POST /api/hyperblogs/purchase
 *
 * Request Body:
 * - payment_header: x402 payment header (required)
 * - dataroom_id: string (required)
 * - user_query: string (required)
 * - is_public?: boolean
 * - blog_length?: "short" | "medium" | "long"
 * - generation_mode?: "blog" | "card"
 * - expected_amount?: string
 */
export async function POST(request: NextRequest) {
  const { data: body, error } =
    await parseJsonBody<Partial<PurchaseBody>>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  if (!body?.payment_header) {
    return createErrorResponse("payment_header is required", 400);
  }
  if (!body?.dataroom_id) {
    return createErrorResponse("dataroom_id is required", 400);
  }
  if (typeof body?.user_query !== "string") {
    return createErrorResponse("user_query is required", 400);
  }

  const paymentHeader =
    typeof body.payment_header === "string"
      ? body.payment_header
      : JSON.stringify(body.payment_header);

  return handleProxyRequest(
    "/datarooms/hyperblogs/purchase",
    {
      method: "POST",
      body: {
        ...body,
        payment_header: body.payment_header,
      },
      headers: {
        "X-Payment-Header": paymentHeader,
      },
    },
    201
  );
}

/**
 * OPTIONS /api/hyperblogs/purchase
 */
export function OPTIONS() {
  return handleCorsOptions();
}
