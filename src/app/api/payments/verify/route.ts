/**
 * Payment Verify API Route
 *
 * POST /api/payments/verify - Verify a payment transaction
 */
import { NextRequest } from "next/server";

import type { PaymentVerifyRequest } from "@/types";

import {
  createErrorResponse,
  createSuccessResponse,
  handleCorsOptions,
  parseJsonBody,
  proxyToBackend,
} from "@/lib/api/server-utils";

/**
 * POST /api/payments/verify
 *
 * Verify a payment header/transaction for x402 protocol.
 *
 * Request Body:
 * - payment_header: string (required) - The x402 payment header
 * - expected_amount?: string - Expected payment amount
 * - resource_type: string (required) - Type: "chat" | "delve" | "dataroom" | "hyperblog"
 * - resource_id?: string - ID of the resource being paid for
 */
export async function POST(request: NextRequest) {
  const { data: body, error } =
    await parseJsonBody<Partial<PaymentVerifyRequest>>(request);

  if (error) {
    return createErrorResponse(error, 400);
  }

  // Validate required fields
  if (!body?.payment_header) {
    return createErrorResponse("payment_header is required", 400);
  }
  if (!body?.resource_type) {
    return createErrorResponse("resource_type is required", 400);
  }

  const validTypes = ["chat", "delve", "dataroom", "hyperblog"];
  if (!validTypes.includes(body.resource_type)) {
    return createErrorResponse(
      `resource_type must be one of: ${validTypes.join(", ")}`,
      400
    );
  }

  // Build verification request based on resource type
  // The backend has different endpoints for different payment types
  let endpoint: string;
  let verifyBody: Record<string, unknown>;

  switch (body.resource_type) {
    case "chat":
      endpoint = `/paid/agents/${body.resource_id}/chat`;
      verifyBody = {
        payment_header: body.payment_header,
        expected_amount: body.expected_amount,
        verify_only: true, // Just verify, don't execute
      };
      break;
    case "delve":
      endpoint = `/paid/agents/${body.resource_id}/delve`;
      verifyBody = {
        payment_header: body.payment_header,
        expected_amount: body.expected_amount,
        verify_only: true,
      };
      break;
    case "dataroom":
    case "hyperblog":
      // For datarooms and hyperblogs, we verify the payment header directly
      // This is a simpler verification that just checks the payment is valid
      endpoint = "/microsubs";
      verifyBody = {
        payment_header: body.payment_header,
        expected_amount: body.expected_amount,
        verify_only: true,
      };
      break;
    default:
      return createErrorResponse("Invalid resource_type", 400);
  }

  const result = await proxyToBackend(endpoint, {
    method: "POST",
    body: verifyBody,
    headers: {
      "X-Payment-Header": body.payment_header,
    },
  });

  if (!result.success) {
    return createErrorResponse(
      result.error?.error ?? "Payment verification failed",
      result.status,
      result.error?.details
    );
  }

  const responseData =
    typeof result.data === "object" && result.data !== null
      ? (result.data as Record<string, unknown>)
      : {};

  return createSuccessResponse({
    verified: true,
    ...responseData,
  });
}

/**
 * OPTIONS /api/payments/verify
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
