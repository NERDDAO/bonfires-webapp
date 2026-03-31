/**
 * Hackathon Rubrics API Route
 *
 * GET /api/hackathon/rubrics - List rubrics for a bonfire
 * Proxies to backend GET /applicant-review-rubrics?bonfire_id=X
 */
import {
  createErrorResponse,
  createSuccessResponse,
  proxyToBackend,
} from "@/lib/api/server-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bonfireId = searchParams.get("bonfire_id");

  const queryParams: Record<string, string> = {};
  if (bonfireId) queryParams["bonfire_id"] = bonfireId;

  const result = await proxyToBackend("/applicant-review-rubrics", {
    method: "GET",
    queryParams,
    includeAuth: true,
  });

  if (!result.success || !result.data) {
    return createErrorResponse(
      result.error?.error ?? "Failed to fetch rubrics",
      result.status,
      result.error?.details,
    );
  }

  return createSuccessResponse(result.data);
}
