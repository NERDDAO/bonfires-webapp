/**
 * /api/auth/wallet-org-link — Next.js proxy route
 *
 * POST: Proxies to backend POST /auth/wallet-org-link with Clerk JWT.
 *       Auto-joins the authenticated wallet owner to their provisioned Clerk orgs.
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  createSuccessResponse,
  handleCorsOptions,
  parseJsonBody,
  proxyToBackend,
} from "@/lib/api/server-utils";

interface WalletOrgLinkRequestBody {
  wallet_address?: string;
}

interface WalletOrgLinkResult {
  clerk_org_id: string;
  bonfire_id: string;
  slug: string | null;
}

interface BackendResponse {
  orgs_joined: WalletOrgLinkResult[];
}

export async function POST(request: NextRequest) {
  const { data: body, error: parseError } =
    await parseJsonBody<WalletOrgLinkRequestBody>(request);

  if (parseError) {
    return createErrorResponse(parseError, 400);
  }

  if (!body?.wallet_address?.trim()) {
    return createErrorResponse("wallet_address is required", 400);
  }

  const result = await proxyToBackend<BackendResponse>(
    "/auth/wallet-org-link",
    {
      method: "POST",
      body: { wallet_address: body.wallet_address.trim() },
      includeAuth: true,
    }
  );

  if (!result.success) {
    return createErrorResponse(
      result.error?.error ?? "Failed to link wallet to organizations",
      result.status,
      result.error?.details
    );
  }

  return createSuccessResponse(result.data ?? { orgs_joined: [] });
}

export function OPTIONS() {
  return handleCorsOptions();
}
