/**
 * GET /api/provision/reveal_nonce
 *
 * Issues a short-lived nonce for the API key reveal challenge.
 * Proxies to backend GET /provision/reveal_nonce?tx_hash=...
 * Returns { nonce, message } where message is the EIP-191 string to sign.
 */
import { NextRequest } from "next/server";

import {
  createErrorResponse,
  createSuccessResponse,
  extractQueryParams,
  handleCorsOptions,
  proxyToBackend,
} from "@/lib/api/server-utils";

interface RevealNonceResponse {
  nonce: string;
  message: string;
}

export async function GET(request: NextRequest) {
  const { tx_hash: txHash } = extractQueryParams(request, ["tx_hash"]);

  if (!txHash?.trim()) {
    return createErrorResponse("tx_hash query parameter is required", 400);
  }

  const result = await proxyToBackend<RevealNonceResponse>(
    "/provision/reveal_nonce",
    {
      method: "GET",
      queryParams: { tx_hash: txHash.trim() },
      includeAuth: false,
    }
  );

  if (!result.success) {
    return createErrorResponse(
      result.error?.error ?? "Failed to get reveal nonce",
      result.status,
      result.error?.details
    );
  }

  return createSuccessResponse(result.data!);
}

export function OPTIONS() {
  return handleCorsOptions();
}
