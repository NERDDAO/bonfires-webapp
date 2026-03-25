/**
 * Payment Config API Route
 *
 * GET /api/payments/config - Proxy to backend /payment/config
 *
 * Supports optional ?hackathon_track_id param to override payTo
 * with the hackathon track's escrow address.
 */
import { proxyToBackend, createSuccessResponse, createErrorResponse } from "@/lib/api/server-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hackathonTrackId = searchParams.get("hackathon_track_id");

  const queryParams: Record<string, string> = {};
  if (hackathonTrackId) queryParams["hackathon_track_id"] = hackathonTrackId;

  const result = await proxyToBackend("/payment/config", {
    method: "GET",
    queryParams,
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
