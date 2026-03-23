/**
 * Payment Config API Route
 *
 * GET /api/payments/config - Proxy to backend /payment/config
 *
 * Avoids CORS issues by proxying server-side.
 */
import { proxyToBackend, createSuccessResponse, createErrorResponse } from "@/lib/api/server-utils";

export async function GET() {
  const result = await proxyToBackend("/payment/config", {
    method: "GET",
    includeAuth: false,
  });

  if (!result.success) {
    return createErrorResponse(
      result.error?.error ?? "Failed to fetch payment config",
      result.status ?? 502
    );
  }

  return createSuccessResponse(result.data);
}
