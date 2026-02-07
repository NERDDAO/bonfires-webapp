/**
 * Resolve Org API Route
 *
 * GET /api/bonfires/[bonfireId]/resolve-org
 *
 * Proxies to Delve backend to determine which Clerk org the signed-in user
 * should activate for this bonfire. Requires authentication — the backend
 * needs the user_id from the Clerk JWT to query org memberships.
 */
import {
  createErrorResponse,
  createSuccessResponse,
  handleCorsOptions,
  proxyToBackend,
} from "@/lib/api/server-utils";

interface ResolveOrgResponse {
  org_id: string;
  is_admin: boolean;
}

interface RouteParams {
  params: Promise<{ bonfireId: string }>;
}

/**
 * GET /api/bonfires/[bonfireId]/resolve-org
 *
 * Resolve which Clerk org a signed-in user should activate for this bonfire.
 * Returns the org_id and whether it's an admin org, or null if no matching org.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { bonfireId } = await params;

  if (!bonfireId) {
    return createErrorResponse("Bonfire ID is required", 400);
  }

  const result = await proxyToBackend<ResolveOrgResponse | null>(
    `/bonfires/${encodeURIComponent(bonfireId)}/resolve-org`,
    {
      method: "GET",
      includeAuth: true,
    }
  );

  if (!result.success) {
    return createErrorResponse(
      result.error?.error ?? "Failed to resolve org",
      result.status,
      result.error?.details,
      result.error?.code
    );
  }

  // Backend returns null when no matching org found — pass it through
  return createSuccessResponse(result.data ?? null);
}

/**
 * OPTIONS /api/bonfires/[bonfireId]/resolve-org
 */
export function OPTIONS() {
  return handleCorsOptions();
}
