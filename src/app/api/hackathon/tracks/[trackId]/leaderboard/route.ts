/**
 * Hackathon Leaderboard API Route
 *
 * GET /api/hackathon/tracks/:trackId/leaderboard - Get paginated leaderboard
 */
import type { LeaderboardResponse } from "@/types";

import {
  createErrorResponse,
  createSuccessResponse,
  proxyToBackend,
} from "@/lib/api/server-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const { trackId } = await params;
  const { searchParams } = new URL(request.url);

  const queryParams: Record<string, string> = {};
  const sortBy = searchParams.get("sort_by");
  const page = searchParams.get("page");
  const perPage = searchParams.get("per_page");
  if (sortBy) queryParams["sort_by"] = sortBy;
  if (page) queryParams["page"] = page;
  if (perPage) queryParams["per_page"] = perPage;

  const result = await proxyToBackend<LeaderboardResponse>(
    `/hackathon/tracks/${trackId}/leaderboard`,
    { method: "GET", queryParams, includeAuth: false }
  );

  if (!result.success || !result.data) {
    return createErrorResponse(
      result.error?.error ?? "Failed to fetch leaderboard",
      result.status,
      result.error?.details
    );
  }

  return createSuccessResponse(result.data);
}
