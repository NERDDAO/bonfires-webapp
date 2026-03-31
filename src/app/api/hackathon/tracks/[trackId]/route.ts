/**
 * Hackathon Track Detail API Route
 *
 * GET /api/hackathon/tracks/:trackId - Get track detail
 */
import type { HackathonTrackInfo } from "@/types";

import {
  createErrorResponse,
  createSuccessResponse,
  proxyToBackend,
} from "@/lib/api/server-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const { trackId } = await params;

  const result = await proxyToBackend<HackathonTrackInfo>(
    `/hackathon/tracks/${trackId}`,
    { method: "GET", includeAuth: false }
  );

  if (!result.success || !result.data) {
    return createErrorResponse(
      result.error?.error ?? "Failed to fetch track",
      result.status,
      result.error?.details
    );
  }

  return createSuccessResponse(result.data);
}
