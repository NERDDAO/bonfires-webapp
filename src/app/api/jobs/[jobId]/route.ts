/**
 * Job Status API Route
 *
 * GET /api/jobs/[jobId] - Get async job status for polling
 *
 * This is the critical endpoint for the async polling pattern.
 * Long-running operations (graph queries, etc.) return a job ID,
 * and clients poll this endpoint until the job completes.
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  handleCorsOptions,
  handleProxyRequest,
} from "@/lib/api/server-utils";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

/**
 * GET /api/jobs/[jobId]
 *
 * Get the current status of an async job.
 *
 * Response:
 * - id: string - Job ID
 * - status: "pending" | "processing" | "complete" | "failed"
 * - progress?: number - Progress percentage (0-100)
 * - result?: any - Result data when status is "complete"
 * - error?: string - Error message when status is "failed"
 * - created_at: string - ISO timestamp
 * - completed_at?: string - ISO timestamp when completed
 *
 * Client Usage:
 * ```typescript
 * // Initiate job
 * const { jobId } = await api.post('/api/graph/query', params);
 *
 * // Poll until complete
 * let job;
 * do {
 *   await sleep(1000);
 *   job = await api.get(`/api/jobs/${jobId}`);
 * } while (job.status === 'pending' || job.status === 'processing');
 *
 * if (job.status === 'complete') {
 *   return job.result;
 * } else {
 *   throw new Error(job.error);
 * }
 * ```
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { jobId } = await params;

  if (!jobId) {
    return createErrorResponse("Job ID is required", 400);
  }

  // Proxy to backend job status endpoint
  return handleProxyRequest(`/jobs/${jobId}/status`, {
    method: "GET",
  });
}

/**
 * OPTIONS /api/jobs/[jobId]
 *
 * Handle CORS preflight requests.
 */
export function OPTIONS() {
  return handleCorsOptions();
}
