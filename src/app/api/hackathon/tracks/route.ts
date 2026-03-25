/**
 * Hackathon Tracks API Route
 *
 * GET /api/hackathon/tracks - List active/upcoming hackathon tracks
 */
import type { HackathonTrackInfo } from "@/types";

import {
  createErrorResponse,
  createSuccessResponse,
  proxyToBackend,
} from "@/lib/api/server-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cadence = searchParams.get("cadence");
  const status = searchParams.get("status");

  const queryParams: Record<string, string> = {};
  if (cadence) queryParams["cadence"] = cadence;
  if (status) queryParams["status"] = status;

  const result = await proxyToBackend<HackathonTrackInfo[]>(
    "/hackathon/tracks",
    {
      method: "GET",
      queryParams,
      includeAuth: false,
    }
  );

  if (!result.success || !result.data) {
    return createErrorResponse(
      result.error?.error ?? "Failed to fetch hackathon tracks",
      result.status,
      result.error?.details
    );
  }

  return createSuccessResponse(result.data);
}
