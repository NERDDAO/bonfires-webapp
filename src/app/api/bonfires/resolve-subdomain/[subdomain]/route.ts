/**
 * Subdomain Resolution API Route
 *
 * GET /api/bonfires/resolve-subdomain/[subdomain] - Resolve slug or ObjectId to bonfire config
 *
 * Proxies to Delve backend. No auth required - subdomain resolution happens before login.
 */
import {
  createErrorResponse,
  createSuccessResponse,
  handleCorsOptions,
  proxyToBackend,
} from "@/lib/api/server-utils";

export interface SubdomainResolutionResponse {
  bonfire_id: string;
  agent_id: string | null;
  slug?: string | null;
}

interface RouteParams {
  params: Promise<{ subdomain: string }>;
}

/**
 * GET /api/bonfires/resolve-subdomain/[subdomain]
 *
 * Resolve subdomain (slug or 24-char ObjectId) to bonfire_id and first agent_id.
 * Returns 404 if not found.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { subdomain } = await params;

  if (!subdomain) {
    return createErrorResponse("Subdomain is required", 400);
  }

  const result = await proxyToBackend<SubdomainResolutionResponse>(
    `/bonfires/resolve-subdomain/${encodeURIComponent(subdomain)}`,
    {
      method: "GET",
      includeAuth: false,
    }
  );

  if (!result.success || !result.data) {
    return createErrorResponse(
      result.error?.error ?? "Subdomain not found",
      result.status,
      result.error?.details,
      result.error?.code
    );
  }

  return createSuccessResponse(result.data);
}

/**
 * OPTIONS /api/bonfires/resolve-subdomain/[subdomain]
 */
export function OPTIONS() {
  return handleCorsOptions();
}
