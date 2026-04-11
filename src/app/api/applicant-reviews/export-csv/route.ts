import { NextRequest, NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

const getBackendUrl = (): string =>
  process.env["DELVE_API_URL"] ??
  process.env["NEXT_PUBLIC_DELVE_API_URL"] ??
  "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { getToken } = await auth();
  const token = await getToken();

  const { searchParams } = request.nextUrl;
  const bonfireId = searchParams.get("bonfire_id");
  if (!bonfireId) {
    return NextResponse.json({ error: "bonfire_id is required" }, { status: 400 });
  }

  const params = new URLSearchParams({ bonfire_id: bonfireId });
  const batchId = searchParams.get("batch_id");
  const rubricId = searchParams.get("rubric_id");
  if (batchId) params.set("batch_id", batchId);
  if (rubricId) params.set("rubric_id", rubricId);

  const url = `${getBackendUrl()}/applicant-reviews-export?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `Backend returned ${response.status}` },
      { status: response.status },
    );
  }

  const csvData = await response.text();
  return new NextResponse(csvData, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=applicant_reviews.csv",
    },
  });
}
