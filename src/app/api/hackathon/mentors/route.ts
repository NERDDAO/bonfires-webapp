/**
 * Hackathon Mentors API Route
 *
 * GET /api/hackathon/mentors - List active mentors
 */
import type { MentorInfo } from "@/types";

import {
  createErrorResponse,
  createSuccessResponse,
  proxyToBackend,
} from "@/lib/api/server-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get("track_id");

  const queryParams: Record<string, string> = {};
  if (trackId) queryParams["track_id"] = trackId;

  const result = await proxyToBackend<MentorInfo[]>("/hackathon/mentors", {
    method: "GET",
    queryParams,
    includeAuth: false,
  });

  if (!result.success || !result.data) {
    return createErrorResponse(
      result.error?.error ?? "Failed to fetch mentors",
      result.status,
      result.error?.details
    );
  }

  return createSuccessResponse(result.data);
}
