import { NextRequest } from "next/server";

import {
  CORS_HEADERS,
  createErrorResponse,
  extractQueryParams,
  getAuthHeaders,
  handleCorsOptions,
} from "@/lib/api/server-utils";

export async function GET(request: NextRequest) {
  const params = extractQueryParams(request, [
    "bonfire_id",
    "batch_id",
    "rubric_id",
  ]);

  if (!params["bonfire_id"]) {
    return createErrorResponse("bonfire_id is required", 400);
  }

  const backendUrl =
    process.env["DELVE_API_URL"] ??
    process.env["NEXT_PUBLIC_DELVE_API_URL"] ??
    "http://localhost:8000";

  const qs = new URLSearchParams(
    Object.entries(params).filter(
      (entry): entry is [string, string] => entry[1] != null
    )
  ).toString();

  const url = `${backendUrl}/applicant-reviews-export${qs ? `?${qs}` : ""}`;
  const authHeaders = await getAuthHeaders();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { ...authHeaders },
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const text = await response.text();
      return createErrorResponse(text || "Backend error", response.status);
    }

    const csvBody = await response.text();

    return new Response(csvBody, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=applicant_reviews.csv",
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    console.error("[CSV Export] Error:", error);
    return createErrorResponse("Failed to export CSV", 500);
  }
}

export function OPTIONS() {
  return handleCorsOptions();
}
